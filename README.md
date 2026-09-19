# Zwei Pyramiden – ein Körper

## Das Rätsel

Gegeben sind zwei Pyramiden:

- eine Pyramide mit **quadratischer Grundfläche**
- eine Pyramide mit **dreieckiger Grundfläche**

Eine Kante der quadratischen Grundfläche und eine gleich lange Kante
der dreieckigen Grundfläche werden deckungsgleich aneinandergelegt.
Diese gemeinsame Kante bildet ein **Scharnier**.

Nun wird eine Pyramide um diese Kante geklappt, bis die **Spitzen
beider Pyramiden exakt auf demselben Punkt liegen**.

**Wie viele Flächen hat der entstandene Körper?**

Die überraschende Antwort: **5 Flächen.**

## Die Rechnung

Die quadratische Pyramide besitzt:

**1 + 4 = 5 Flächen**

Die dreieckige Pyramide besitzt:

**1 + 3 = 4 Flächen**

Zusammen sind das zunächst:

**5 + 4 = 9 Flächen**

Beim Zusammenklappen verschwinden zwei Flächen im Inneren:

**9 − 2 = 7 Flächen**

Außerdem verschmelzen auf zwei Seiten jeweils zwei ursprünglich
getrennte Dreiecksflächen zu einer einzigen ebenen Fläche:

**7 − 2 = 5 Flächen**

## Warum sind es nur fünf Flächen?

Der entscheidende Punkt ist, dass eine Fläche eines Polyeders nicht
danach gezählt wird, aus wie vielen ursprünglichen Dreiecken sie
konstruiert wurde.

Liegen zwei benachbarte Dreiecke **exakt in derselben Ebene**, gibt es
zwischen ihnen geometrisch keinen Knick. Ihre gemeinsame Linie ist
deshalb keine Kante des fertigen Körpers. Beide Dreiecke bilden
zusammen **eine einzige größere Fläche**.

Beim Falten passieren also zwei Dinge:

1. **Zwei Flächen verschwinden im Inneren** des Körpers.
2. **Zweimal verschmelzen je zwei Seitenflächen** zu einer gemeinsamen
   ebenen Fläche.

Aus den ursprünglich neun Flächen werden deshalb:

**9 − 2 − 2 = 5 Flächen**

Das 3D-Modell macht diesen zunächst etwas unintuitiven Effekt sichtbar.

## Interaktives 3D-Modell

Das Rätsel lässt sich direkt im Browser ausprobieren:

[3D-Modell öffnen](https://marsrakete.github.io/pyramiden/)

## Weitere Modelle

- [Kegelschnitt](kegelschnitt_ellipse_begrenzt.html): eine Ebene schneidet einen Kegel.

Entwicklung, Modulstruktur und Tests: [TECHNICAL.md](TECHNICAL.md).
Die mathematische Herleitung mit gesetzten Formeln: [TECHNICAL.html](TECHNICAL.html).
