# Progressive-Resize-Illustrator-JSX
Piccolo tool ScriptUI per Adobe Illustrator che applica variazioni progressive di larghezza/altezza a una selezione di oggetti.

Features

Modifica progressiva di Height o Width, o scala proporzionale guidata da uno dei due assi.
Due modalità di calcolo:
Increment (step in px o %)
Range (start → end con interpolazione: Linear / Ease In / Ease Out / Ease In-Out)
Ordinamento degli oggetti: Left to Right, Top to Bottom, Layer Order (+ opzione Reverse).
Anchor point 3\times3 per mantenere il pivot desiderato.
Opzione per scalare anche stroke & effetti.
UI icon-based con label dinamiche per i gruppi critici.
Aspettativa: script + cartella icons/ (tutti i PNG delle icone).
Requisiti

Adobe Illustrator (versione con supporto ExtendScript / ScriptUI). Testato su CC recenti ma compatibilità può variare tra release.
File script: progressive_resize_illustrator.jsx
Cartella icone: icons/ (dentro la stessa cartella dello script)
Installazione

Crea una cartella locale per il progetto.
Metti dentro:
progressive_resize_illustrator.jsx
sottocartella icons/ con tutte le PNG necessarie (nomi previsti nello script).
Apri Illustrator e carica lo script (File → Scripts → Other Script... oppure trascina nello script panel se usi un loader).
Nomi icone attesi (esempi)

- icons/heightActive.png
- icons/heightDisabled.png
icons/widthActive.png
icons/widthDisabled.png
icons/propFromHeightActive.png
icons/propFromHeightDisabled.png
icons/propFromWidthActive.png
icons/propFromWidthDisabled.png
icons/leftToRightActive.png
icons/leftToRightDisabled.png
icons/topToBottomActive.png
icons/topToBottomDisabled.png
icons/layersOrderActive.png
icons/layersOrderDisabled.png
icons/stepActive.png
icons/stepDisabled.png
icons/rangeActive.png
icons/rangeDisabled.png
icons/pixelActive.png
icons/pixelDisabled.png
icons/percentActive.png
icons/percentDisabled.png
icons/linearActive.png
icons/linearDisabled.png
icons/easeInActive.png
icons/easeInDisabled.png
icons/easeOutActive.png
icons/easeOutDisabled.png
icons/easingActive.png
icons/easingDisabled.png
(Se mancano icone, lo script usa testo di fallback; meglio comunque fornire tutti gli asset.)

Uso rapido

Seleziona in Illustrator almeno 2 oggetti (meglio oggetti semplici: rettangoli, path non ruotati, gruppi semplici).
Esegui lo script.
Scegli:
Resize method
Order objects (+ Reverse se serve)
Resize mode (Increment o Range)
Parametri (unità, step, start/end, interpolation)
Anchor point e opzioni (es. Scale strokes and effects)
OK per applicare.
Comportamenti chiave e note d'uso

Percentuali:
In Increment: le percentuali sono lineari rispetto alla dimensione originale (no compounding).
In Range: Start/End sono interpretati come percentuale della dimensione originale (100 = originale).
Anchor: lo script ridimensiona e poi riposiziona per mantenere fisso il pivot selezionato.
Layer Order: ordina secondo z-order; attenzione a selezioni multi-layer o gruppi complessi.
Oggetti ruotati, clipping mask e testi molto complessi possono variare nel comportamento — testare prima su copie.
