(function () {
    if (app.documents.length === 0) {
        alert("Open a document first.");
        return;
    }

    var doc = app.activeDocument;
    if (!doc.selection || doc.selection.length < 2) {
        alert("Select at least 2 objects.");
        return;
    }

    function isResizableItem(item) {
        if (!item) return false;
        var t = item.typename;
        return (
            t === "PathItem" ||
            t === "CompoundPathItem" ||
            t === "GroupItem" ||
            t === "TextFrame" ||
            t === "PlacedItem" ||
            t === "RasterItem" ||
            t === "SymbolItem"
        );
    }

    function collectSelection(selection) {
        var items = [];
        for (var i = 0; i < selection.length; i++) {
            if (isResizableItem(selection[i])) items.push(selection[i]);
        }
        return items;
    }

    var sourceItems = collectSelection(doc.selection);
    if (sourceItems.length < 2) {
        alert("The selection must contain at least 2 supported objects.");
        return;
    }

    function getScriptFolder() {
        try {
            return File($.fileName).parent;
        } catch (e) {
            return Folder.myDocuments;
        }
    }

    function getIconsFolder() {
        var base = getScriptFolder();
        return new Folder(base.fsName + "/icons");
    }

    function loadIcon(name) {
        try {
            var folder = getIconsFolder();
            var file = new File(folder.fsName + "/" + name);
            if (file.exists) return ScriptUI.newImage(file);
        } catch (e) {}
        return null;
    }

    function createIconToggle(parent, width, height, helpTip, onClick) {
        var btn = parent.add("image");
        btn.addEventListener("click", onClick);
        btn.preferredSize = [width, height];
        btn.helpTip = helpTip || "";
        btn._activeImage = null;
        btn._inactiveImage = null;
        btn._fallbackText = "";
        btn._selected = false;
        btn.onClick = onClick;
        return btn;
    }

    function setIconState(btn, selected, enabled) {
        btn._selected = selected;
        btn.enabled = enabled !== false;

        if (btn._activeImage || btn._inactiveImage) {
            btn.image = selected ? (btn._activeImage || btn._inactiveImage) : (btn._inactiveImage || btn._activeImage);
            btn.text = "";
        } else {
            btn.text = btn._fallbackText || "?";
        }
    }

    function applySelectionMap(map, selectedKey, enabled) {
        for (var key in map) {
            setIconState(map[key], key === selectedKey, enabled);
        }
    }

    function buildUI() {
        var w = new Window("dialog", "Progressive Resize");
        w.orientation = "column";
        w.alignChildren = ["fill", "top"];
        w.spacing = 10;
        w.margins = 16;

        var topRow = w.add("group");
        topRow.orientation = "row";
        topRow.alignChildren = ["fill", "fill"];
        topRow.spacing = 10;

        var leftCol = topRow.add("group");
        leftCol.orientation = "column";
        leftCol.alignChildren = ["fill", "top"];
        leftCol.spacing = 10;

        var rightCol = topRow.add("group");
        rightCol.orientation = "column";
        rightCol.alignChildren = ["fill", "top"];
        rightCol.spacing = 10;

        var pMethod = leftCol.add("panel", undefined, "Resize method");
        pMethod.orientation = "column";
        pMethod.alignChildren = ["left", "top"];
        pMethod.margins = 12;
        var methodGrid = pMethod.add("group");
        methodGrid.orientation = "column";
        methodGrid.spacing = 6;
        var methodButtons = {};
        var methodSelected = "heightOnly";
        var methodRow1 = methodGrid.add("group");
        methodRow1.orientation = "row";
        methodRow1.spacing = 6;
        var methodRow2 = methodGrid.add("group");
        methodRow2.orientation = "row";
        methodRow2.spacing = 6;

        methodButtons.heightOnly = createIconToggle(methodRow1, 34, 34, "Height", function () { selectMethod("heightOnly"); });
        methodButtons.widthOnly = createIconToggle(methodRow1, 34, 34, "Width", function () { selectMethod("widthOnly"); });
        methodButtons.propHeight = createIconToggle(methodRow2, 34, 34, "Scale by height", function () { selectMethod("propHeight"); });
        methodButtons.propWidth = createIconToggle(methodRow2, 34, 34, "Scale by width", function () { selectMethod("propWidth"); });

        methodButtons.heightOnly._activeImage = loadIcon("heightActive.png");
        methodButtons.heightOnly._inactiveImage = loadIcon("heightDisabled.png");
        methodButtons.heightOnly._fallbackText = "H";
        methodButtons.widthOnly._activeImage = loadIcon("widthActive.png");
        methodButtons.widthOnly._inactiveImage = loadIcon("widthDisabled.png");
        methodButtons.widthOnly._fallbackText = "W";
        methodButtons.propHeight._activeImage = loadIcon("propFromHeightActive.png");
        methodButtons.propHeight._inactiveImage = loadIcon("propFromHeightDisabled.png");
        methodButtons.propHeight._fallbackText = "SH";
        methodButtons.propWidth._activeImage = loadIcon("propFromWidthActive.png");
        methodButtons.propWidth._inactiveImage = loadIcon("propFromWidthDisabled.png");
        methodButtons.propWidth._fallbackText = "SW";

        var methodLabel = pMethod.add("statictext", undefined, "Scale by width");
        methodLabel.minimumSize.width = 120;

        var pOrder = rightCol.add("panel", undefined, "Order objects");
        pOrder.orientation = "column";
        pOrder.alignChildren = ["left", "top"];
        pOrder.margins = 12;
        var orderRow = pOrder.add("group");
        orderRow.orientation = "row";
        orderRow.spacing = 6;
        var orderButtons = {};
        var orderSelected = "Left to Right";

        orderButtons["Left to Right"] = createIconToggle(orderRow, 34, 34, "Left to right", function () { selectOrder("Left to Right"); });
        orderButtons["Top to Bottom"] = createIconToggle(orderRow, 34, 34, "Top to bottom", function () { selectOrder("Top to Bottom"); });
        orderButtons["Layer Order"] = createIconToggle(orderRow, 34, 34, "Layer order", function () { selectOrder("Layer Order"); });

        orderButtons["Left to Right"]._activeImage = loadIcon("leftToRightActive.png");
        orderButtons["Left to Right"]._inactiveImage = loadIcon("leftToRightDisabled.png");
        orderButtons["Left to Right"]._fallbackText = "LR";
        orderButtons["Top to Bottom"]._activeImage = loadIcon("topToBottomActive.png");
        orderButtons["Top to Bottom"]._inactiveImage = loadIcon("topToBottomDisabled.png");
        orderButtons["Top to Bottom"]._fallbackText = "TB";
        orderButtons["Layer Order"]._activeImage = loadIcon("layersOrderActive.png");
        orderButtons["Layer Order"]._inactiveImage = loadIcon("layersOrderDisabled.png");
        orderButtons["Layer Order"]._fallbackText = "LO";

        var cbReverse = pOrder.add("checkbox", undefined, "Reverse order");
        cbReverse.value = false;
        var orderLabel = pOrder.add("statictext", undefined, "Left to right");
        orderLabel.minimumSize.width = 100;

        var secondRow = w.add("group");
        secondRow.orientation = "row";
        secondRow.alignChildren = ["fill", "fill"];
        secondRow.spacing = 10;

        var pMode = secondRow.add("panel", undefined, "Resize mode");
        pMode.orientation = "column";
        pMode.alignChildren = ["left", "top"];
        pMode.margins = 12;
        var modeRow = pMode.add("group");
        modeRow.orientation = "row";
        modeRow.spacing = 6;
        var modeButtons = {};
        var modeSelected = "increment";

        modeButtons.increment = createIconToggle(modeRow, 34, 34, "Increment", function () { selectMode("increment"); });
        modeButtons.range = createIconToggle(modeRow, 34, 34, "Range", function () { selectMode("range"); });
        modeButtons.increment._activeImage = loadIcon("stepActive.png");
        modeButtons.increment._inactiveImage = loadIcon("stepDisabled.png");
        modeButtons.increment._fallbackText = "I";
        modeButtons.range._activeImage = loadIcon("rangeActive.png");
        modeButtons.range._inactiveImage = loadIcon("rangeDisabled.png");
        modeButtons.range._fallbackText = "R";
        var modeLabel = pMode.add("statictext", undefined, "Increment");

        var pAnchor = secondRow.add("panel", undefined, "Anchor point");
        pAnchor.orientation = "column";
        pAnchor.alignChildren = ["center", "top"];
        pAnchor.margins = 12;
        var anchorButtons = {};
        var anchorSelected = "cc";

        function selectAnchor(key) {
            for (var name in anchorButtons) {
                anchorButtons[name].value = (name === key);
            }
            anchorSelected = key;
        }

        function makeAnchorRow(keys, defaultKey) {
            var row = pAnchor.add("group");
            row.orientation = "row";
            row.spacing = 10;
            for (var i = 0; i < keys.length; i++) {
                (function (key) {
                    var rb = row.add("radiobutton", undefined, "");
                    rb.preferredSize = [18, 18];
                    anchorButtons[key] = rb;
                    rb.onClick = function () {
                        selectAnchor(key);
                    };
                    if (key === defaultKey) {
                        rb.value = true;
                        anchorSelected = key;
                    }
                })(keys[i]);
            }
        }
        makeAnchorRow(["tl", "tc", "tr"], null);
        makeAnchorRow(["cl", "cc", "cr"], "cc");
        makeAnchorRow(["bl", "bc", "br"], null);
        selectAnchor(anchorSelected);

        var settingsContainer = w.add("group");
        settingsContainer.orientation = "stack";
        settingsContainer.alignChildren = ["fill", "top"];

        var pIncrement = settingsContainer.add("panel", undefined, "Increment settings");

        pIncrement.orientation = "column";
        pIncrement.alignChildren = ["fill", "top"];
        pIncrement.margins = 12;

        var incTop = pIncrement.add("group");
        incTop.orientation = "row";
        incTop.alignChildren = ["left", "center"];
        incTop.spacing = 18;

        var incUnitGroup = incTop.add("group");
        incUnitGroup.orientation = "row";
        incUnitGroup.alignChildren = ["left", "center"];
        incUnitGroup.spacing = 8;
        incUnitGroup.add("statictext", undefined, "Unit");
        var incUnitButtons = {};
        var incUnitSelected = "Pixels";
        incUnitButtons.Pixels = createIconToggle(incUnitGroup, 34, 34, "Pixels", function () { selectIncUnit("Pixels"); });
        incUnitButtons.Percent = createIconToggle(incUnitGroup, 34, 34, "Percent", function () { selectIncUnit("Percent"); });
        incUnitButtons.Pixels._activeImage = loadIcon("pixelActive.png");
        incUnitButtons.Pixels._inactiveImage = loadIcon("pixelDisabled.png");
        incUnitButtons.Pixels._fallbackText = "px";
        incUnitButtons.Percent._activeImage = loadIcon("percentActive.png");
        incUnitButtons.Percent._inactiveImage = loadIcon("percentDisabled.png");
        incUnitButtons.Percent._fallbackText = "%";

        var incStepGroup = incTop.add("group");
        incStepGroup.orientation = "row";
        incStepGroup.alignChildren = ["left", "center"];
        incStepGroup.spacing = 8;
        incStepGroup.add("statictext", undefined, "Step");
        var etIncStep = incStepGroup.add("edittext", undefined, "10");
        etIncStep.characters = 10;

        var cbApplyFirst = pIncrement.add("checkbox", undefined, "Apply to first object");
        cbApplyFirst.value = true;

        var pRange = settingsContainer.add("panel", undefined, "Range settings");
        pRange.orientation = "column";
        pRange.alignChildren = ["fill", "top"];
        pRange.margins = 12;

        var rangeTop = pRange.add("group");
        rangeTop.orientation = "row";
        rangeTop.alignChildren = ["left", "top"];
        rangeTop.spacing = 20;

        var rangeUnitGroup = rangeTop.add("group");
        rangeUnitGroup.orientation = "row";
        rangeUnitGroup.alignChildren = ["left", "center"];
        rangeUnitGroup.spacing = 8;
        rangeUnitGroup.add("statictext", undefined, "Unit");
        var rangeUnitButtons = {};
        var rangeUnitSelected = "Percent";
        rangeUnitButtons.Pixels = createIconToggle(rangeUnitGroup, 34, 34, "Pixels", function () { selectRangeUnit("Pixels"); });
        rangeUnitButtons.Percent = createIconToggle(rangeUnitGroup, 34, 34, "Percent", function () { selectRangeUnit("Percent"); });
        rangeUnitButtons.Percent._activeImage = loadIcon("percentActive.png");
        rangeUnitButtons.Percent._inactiveImage = loadIcon("percentDisabled.png");
        rangeUnitButtons.Percent._fallbackText = "%";
        rangeUnitButtons.Pixels._activeImage = loadIcon("pixelActive.png");
        rangeUnitButtons.Pixels._inactiveImage = loadIcon("pixelDisabled.png");
        rangeUnitButtons.Pixels._fallbackText = "px";

        var rangeValues = rangeTop.add("group");
        rangeValues.orientation = "column";
        rangeValues.alignChildren = ["left", "center"];
        rangeValues.spacing = 6;
        var gStart = rangeValues.add("group");
        gStart.orientation = "row";
        gStart.alignChildren = ["left", "center"];
        gStart.spacing = 8;
        gStart.add("statictext", undefined, "Start");
        var etRangeStart = gStart.add("edittext", undefined, "100");
        etRangeStart.characters = 10;
        var gEnd = rangeValues.add("group");
        gEnd.orientation = "row";
        gEnd.alignChildren = ["left", "center"];
        gEnd.spacing = 8;
        gEnd.add("statictext", undefined, "End");
        var etRangeEnd = gEnd.add("edittext", undefined, "120");
        etRangeEnd.characters = 10;

        var interpPanel = pRange.add("panel", undefined, "Interpolation");
        interpPanel.orientation = "row";
        interpPanel.alignChildren = ["left", "center"];
        interpPanel.margins = 10;
        interpPanel.spacing = 6;
        var interpButtons = {};
        var interpSelected = "Ease In-Out";
        interpButtons["Linear"] = createIconToggle(interpPanel, 34, 34, "Linear", function () { selectInterp("Linear"); });
        interpButtons["Ease In"] = createIconToggle(interpPanel, 34, 34, "Ease In", function () { selectInterp("Ease In"); });
        interpButtons["Ease Out"] = createIconToggle(interpPanel, 34, 34, "Ease Out", function () { selectInterp("Ease Out"); });
        interpButtons["Ease In-Out"] = createIconToggle(interpPanel, 34, 34, "Ease In-Out", function () { selectInterp("Ease In-Out"); });
        interpButtons["Linear"]._activeImage = loadIcon("linearActive.png");
        interpButtons["Linear"]._inactiveImage = loadIcon("linearDisabled.png");
        interpButtons["Linear"]._fallbackText = "L";
        interpButtons["Ease In"]._activeImage = loadIcon("easeInActive.png");
        interpButtons["Ease In"]._inactiveImage = loadIcon("easeInDisabled.png");
        interpButtons["Ease In"]._fallbackText = "EI";
        interpButtons["Ease Out"]._activeImage = loadIcon("easeOutActive.png");
        interpButtons["Ease Out"]._inactiveImage = loadIcon("easeOutDisabled.png");
        interpButtons["Ease Out"]._fallbackText = "EO";
        interpButtons["Ease In-Out"]._activeImage = loadIcon("easingActive.png");
        interpButtons["Ease In-Out"]._inactiveImage = loadIcon("easingDisabled.png");
        interpButtons["Ease In-Out"]._fallbackText = "EIO";
        var interpLabel = interpPanel.add("statictext", undefined, "Ease In-Out");
        orderLabel.minimumSize.width = 100;

        var pOptions = w.add("panel", undefined, "Options");
        pOptions.orientation = "column";
        pOptions.alignChildren = ["left", "top"];
        pOptions.margins = 12;
        var cbScaleStroke = pOptions.add("checkbox", undefined, "Scale strokes and effects");
        cbScaleStroke.value = false;

        var buttons = w.add("group");
        buttons.alignment = "center";
        buttons.spacing = 14;
        var okBtn = buttons.add("button", undefined, "OK", {name: "ok"});
        var cancelBtn = buttons.add("button", undefined, "Cancel", {name: "cancel"});
        okBtn.preferredSize = [100, 28];
        cancelBtn.preferredSize = [100, 28];

        function selectMethod(key) {
            methodSelected = key;
            applySelectionMap(methodButtons, key, true);
            var labels = {
                heightOnly: "Height",
                widthOnly: "Width",
                propHeight: "Scale by height",
                propWidth: "Scale by width"
            };
            methodLabel.text = labels[key] || "";
        }

        function selectOrder(key) {
            orderSelected = key;
            applySelectionMap(orderButtons, key, true);
            var labels = {
                "Left to Right": "Left to right",
                "Top to Bottom": "Top to bottom",
                "Layer Order": "Layer order"
            };
            orderLabel.text = labels[key] || "";
            w.layout.layout(true);
        }

        function selectMode(key) {
            modeSelected = key;
            applySelectionMap(modeButtons, key, true);
            modeLabel.text = key === "increment" ? "Increment" : "Range";
            updateModePanels();
        }

        function selectIncUnit(key) {
            incUnitSelected = key;
            applySelectionMap(incUnitButtons, key, pIncrement.enabled);
        }

        function selectRangeUnit(key) {
            rangeUnitSelected = key;
            applySelectionMap(rangeUnitButtons, key, pRange.enabled);
        }

        function selectInterp(key) {
            interpSelected = key;
            applySelectionMap(interpButtons, key, pRange.enabled);
        var labels = {
            "Linear": "Linear",
            "Ease In": "Ease In",
            "Ease Out": "Ease Out",
            "Ease In-Out": "Ease In-Out"
            };
            interpLabel.text = key;
            w.layout.layout(true);
        }
        

        function updateModePanels() {
            var isIncrement = modeSelected === "increment";

            pIncrement.visible = isIncrement;
            pRange.visible = !isIncrement;

            applySelectionMap(incUnitButtons, incUnitSelected, isIncrement);
            applySelectionMap(rangeUnitButtons, rangeUnitSelected, !isIncrement);
            applySelectionMap(interpButtons, interpSelected, !isIncrement);

            w.layout.layout(true);
            w.layout.resize();
        }

        function getSelectedAnchor() {
            return anchorSelected || "cc";
        }

        selectMethod(methodSelected);
        selectOrder(orderSelected);
        selectMode(modeSelected);
        selectIncUnit(incUnitSelected);
        selectRangeUnit(rangeUnitSelected);
        selectInterp(interpSelected);
        updateModePanels();

        okBtn.onClick = function () {
            function parseNum(v, label) {
                var n = parseFloat(v);
                if (isNaN(n)) throw new Error("Invalid numeric value for " + label + ".");
                return n;
            }

            try {
                var cfg = {};
                cfg.resizeMethod = methodSelected;
                cfg.orderBy = orderSelected;
                cfg.reverse = cbReverse.value;
                cfg.mode = modeSelected;
                cfg.anchor = getSelectedAnchor();
                cfg.scaleStroke = cbScaleStroke.value;

                if (cfg.mode === "increment") {
                    cfg.unit = incUnitSelected;
                    cfg.step = parseNum(etIncStep.text, "Step");
                    cfg.applyFirst = cbApplyFirst.value;
                } else {
                    cfg.unit = rangeUnitSelected;
                    cfg.start = parseNum(etRangeStart.text, "Start");
                    cfg.end = parseNum(etRangeEnd.text, "End");
                    cfg.interpolation = interpSelected;
                }

                w.result = cfg;
                w.close(1);
            } catch (e) {
                alert(e.message);
            }
        };

        cancelBtn.onClick = function () {
            w.close(0);
        };

        return w;
    }

    var ui = buildUI();
    if (ui.show() !== 1) return;
    var settings = ui.result;

    function getGeometricBounds(item) {
        var gb = item.geometricBounds;
        return {
            left: gb[0],
            top: gb[1],
            right: gb[2],
            bottom: gb[3],
            width: gb[2] - gb[0],
            height: gb[1] - gb[3]
        };
    }

    function getAnchorPoint(bounds, anchor) {
        var x, y;

        if (anchor === "tl" || anchor === "cl" || anchor === "bl") x = bounds.left;
        else if (anchor === "tc" || anchor === "cc" || anchor === "bc") x = bounds.left + bounds.width / 2;
        else x = bounds.right;

        if (anchor === "tl" || anchor === "tc" || anchor === "tr") y = bounds.top;
        else if (anchor === "cl" || anchor === "cc" || anchor === "cr") y = bounds.bottom + bounds.height / 2;
        else y = bounds.bottom;

        return {x: x, y: y};
    }

    function moveItemBy(item, dx, dy) {
        item.translate(dx, dy);
    }

    function resizeAroundAnchor(item, scaleX, scaleY, anchor, scaleStroke) {
        var before = getGeometricBounds(item);
        var beforeAnchor = getAnchorPoint(before, anchor);

        var changeLineWidths = scaleStroke ? Math.max(scaleX, scaleY) : 100;

        item.resize(
            scaleX,
            scaleY,
            true,
            true,
            true,
            true,
            changeLineWidths,
            Transformation.CENTER
        );

        var after = getGeometricBounds(item);
        var afterAnchor = getAnchorPoint(after, anchor);
        moveItemBy(item, beforeAnchor.x - afterAnchor.x, beforeAnchor.y - afterAnchor.y);
    }

    function getLayerOrderIndex(item) {
        try {
            return item.zOrderPosition;
        } catch (e) {
            return 0;
        }
    }

    function sortItems(items, orderBy, reverse) {
        var arr = items.slice(0);
        arr.sort(function (a, b) {
            var ba = getGeometricBounds(a);
            var bb = getGeometricBounds(b);

            if (orderBy === "Left to Right") {
                if (ba.left !== bb.left) return ba.left - bb.left;
                if (ba.top !== bb.top) return bb.top - ba.top;
                return getLayerOrderIndex(a) - getLayerOrderIndex(b);
            }

            if (orderBy === "Top to Bottom") {
                if (ba.top !== bb.top) return bb.top - ba.top;
                if (ba.left !== bb.left) return ba.left - bb.left;
                return getLayerOrderIndex(a) - getLayerOrderIndex(b);
            }

            return getLayerOrderIndex(a) - getLayerOrderIndex(b);
        });

        if (reverse) arr.reverse();
        return arr;
    }

    function easeValue(t, type) {
        if (type === "Linear") return t;
        if (type === "Ease In") return t * t;
        if (type === "Ease Out") return 1 - Math.pow(1 - t, 2);
        if (type === "Ease In-Out") {
            if (t < 0.5) return 2 * t * t;
            return 1 - Math.pow(-2 * t + 2, 2) / 2;
        }
        return t;
    }

    function clampPositive(v) {
        return v < 0.0001 ? 0.0001 : v;
    }

    function getCurrentDriverSize(bounds, resizeMethod) {
        if (resizeMethod === "heightOnly" || resizeMethod === "propHeight") return bounds.height;
        return bounds.width;
    }

    function applyTargetSize(item, targetSize, resizeMethod, anchor, scaleStroke) {
        var bounds = getGeometricBounds(item);
        var currentWidth = bounds.width;
        var currentHeight = bounds.height;
        var scaleX = 100;
        var scaleY = 100;

        targetSize = clampPositive(targetSize);

        if (resizeMethod === "heightOnly") {
            if (currentHeight === 0) return;
            scaleY = (targetSize / currentHeight) * 100;
        } else if (resizeMethod === "widthOnly") {
            if (currentWidth === 0) return;
            scaleX = (targetSize / currentWidth) * 100;
        } else if (resizeMethod === "propHeight") {
            if (currentHeight === 0) return;
            scaleX = scaleY = (targetSize / currentHeight) * 100;
        } else if (resizeMethod === "propWidth") {
            if (currentWidth === 0) return;
            scaleX = scaleY = (targetSize / currentWidth) * 100;
        }

        resizeAroundAnchor(item, scaleX, scaleY, anchor, scaleStroke);
    }

    function computeIncrementTarget(baseSize, index, step, unit, applyFirst) {
        var stepIndex = applyFirst ? (index + 1) : index;
        if (unit === "Pixels") {
            return baseSize + (step * stepIndex);
        }
        return baseSize * (1 + (step * stepIndex) / 100);
    }

    function computeRangeTarget(baseSize, index, total, start, end, unit, interpolation) {
        var t = total <= 1 ? 0 : index / (total - 1);
        var e = easeValue(t, interpolation);
        var value = start + ((end - start) * e);
        if (unit === "Pixels") return value;
        return baseSize * (value / 100);
    }

    var items = sortItems(sourceItems, settings.orderBy, settings.reverse);

    try {
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var bounds = getGeometricBounds(item);
            var baseSize = getCurrentDriverSize(bounds, settings.resizeMethod);
            var targetSize;

            if (settings.mode === "increment") {
                targetSize = computeIncrementTarget(
                    baseSize,
                    i,
                    settings.step,
                    settings.unit,
                    settings.applyFirst
                );
            } else {
                targetSize = computeRangeTarget(
                    baseSize,
                    i,
                    items.length,
                    settings.start,
                    settings.end,
                    settings.unit,
                    settings.interpolation
                );
            }

            applyTargetSize(
                item,
                targetSize,
                settings.resizeMethod,
                settings.anchor,
                settings.scaleStroke
            );
        }
    } catch (e) {
        alert("Error while resizing objects: " + e.message);
    }
})();
