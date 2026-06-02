export function parseMusicXML(xmlString) {
    if (!xmlString) return {};

    try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, "text/xml");

        const title =
            xml.querySelector("work-title")?.textContent ||
            xml.querySelector("movement-title")?.textContent ||
            "Untitled";

        const composer =
            xml.querySelector(
                'identification creator[type="composer"]'
            )?.textContent || "";

        const tempoNode = xml.querySelector("sound[tempo]");
        const tempo = tempoNode
            ? Number(tempoNode.getAttribute("tempo"))
            : null;

        const beats = xml.querySelector("time beats")?.textContent;
        const beatType = xml.querySelector("time beat-type")?.textContent;

        const timeSignature =
            beats && beatType ? `${beats}/${beatType}` : null;

        const fifths = xml.querySelector("key fifths")?.textContent;

        return {
            title,
            composer,
            tempo,
            timeSignature,
            fifths,
        };
    } catch (err) {
        console.error("MusicXML parse failed:", err);
        return {};
    }
}

function getChild(parent, name) {
    if (!parent?.elements) return null;

    return parent.elements.find(
        (el) =>
            el.type === "element" &&
            el.name === name
    );
}

function getText(element) {
    if (!element?.elements) return null;

    const textNode =
        element.elements.find(
            (el) => el.type === "text"
        );

    return textNode
        ? textNode.text
        : null;
}

function calcDurationBeats(duration, divisions, timeSignature) {
    const { beats, beatType } = timeSignature;
    const quarterBeats = duration / divisions;
    const simpleBeats = quarterBeats * (beatType / 4); 

    const isCompound =
        beats % 3 === 0 && beats !== 3;

    return isCompound
        ? simpleBeats / 1.5
        : simpleBeats;
}

export function extractNotesFromParsedXML(parsed) {

    const score =
        parsed.elements?.find(
            (el) =>
                el.type === "element" &&
                el.name === "score-partwise"
        );

    if (!score) {
        console.error(
            "No score-partwise found"
        );
        return [];
    }

    const part =
        getChild(score, "part");

    if (!part) {
        console.error(
            "No part found"
        );
        return [];
    }

    const measures =
        part.elements?.filter(
            (el) =>
                el.type === "element" &&
                el.name === "measure"
        ) || [];

    console.log(
        "Measures:",
        measures.length
    );

    const extractedNotes = [];

    let currentKeySignature = 0;

    let currentDivisions = 1;

    let currentTimeSignature = {
        beats: 4,
        beatType: 4,
    };

    measures.forEach(
        (measure, measureIndex) => {

            const attributes =
                getChild(
                    measure,
                    "attributes"
                );

            if (attributes) {

                const divisionsElement =
                    getChild(
                        attributes,
                        "divisions"
                    );

                if (divisionsElement) {

                    const divisionsVal =
                        parseInt(
                            getText(
                                divisionsElement
                            )
                        );

                    if (
                        !isNaN(divisionsVal) &&
                        divisionsVal > 0
                    ) {
                        currentDivisions =
                            divisionsVal;
                    }
                }

                const key =
                    getChild(
                        attributes,
                        "key"
                    );

                if (key) {

                    const fifths =
                        getChild(
                            key,
                            "fifths"
                        );

                    if (fifths) {

                        currentKeySignature =
                            parseInt(
                                getText(
                                    fifths
                                )
                            );
                    }
                }

                const time =
                    getChild(
                        attributes,
                        "time"
                    );

                if (time) {

                    const beats =
                        getText(
                            getChild(
                                time,
                                "beats"
                            )
                        );

                    const beatType =
                        getText(
                            getChild(
                                time,
                                "beat-type"
                            )
                        );

                    currentTimeSignature = {
                        beats:
                            parseInt(
                                beats
                            ),
                        beatType:
                            parseInt(
                                beatType
                            ),
                    };
                }
            }

            const noteElements =
                measure.elements?.filter(
                    (el) =>
                        el.type === "element" &&
                        el.name === "note"
                ) || [];

            noteElements.forEach(
                (note) => {

                    const durationElement =
                        getChild(
                            note,
                            "duration"
                        );

                    const duration =
                        durationElement
                            ? parseInt(
                                getText(
                                    durationElement
                                )
                            )
                            : 0;

                    const rest =
                        getChild(
                            note,
                            "rest"
                        );

                    if (rest) {

                        extractedNotes.push({
                            step: null,
                            octave: null,
                            alter: 0,
                            duration,
                            durationBeats:
                                calcDurationBeats(
                                    duration,
                                    currentDivisions,
                                    currentTimeSignature
                                ),

                            isRest: true,

                            measureNumber:
                                measureIndex + 1,

                            keySignature:
                                currentKeySignature,

                            timeSignature:
                                currentTimeSignature,
                        });

                        return;
                    }

                    const pitch =
                        getChild(
                            note,
                            "pitch"
                        );

                    if (!pitch) {
                        return;
                    }

                    const stepElement =
                        getChild(
                            pitch,
                            "step"
                        );

                    const octaveElement =
                        getChild(
                            pitch,
                            "octave"
                        );

                    const alterElement =
                        getChild(
                            pitch,
                            "alter"
                        );

                    const step =
                        getText(
                            stepElement
                        );

                    const octave =
                        octaveElement
                            ? parseInt(
                                getText(
                                    octaveElement
                                )
                            )
                            : null;

                    const alter =
                        alterElement
                            ? parseInt(
                                getText(
                                    alterElement
                                )
                            )
                            : 0;

                    extractedNotes.push({
                        step,
                        octave,
                        alter,
                        duration,
                        durationBeats:
                            calcDurationBeats(
                                duration,
                                currentDivisions,
                                currentTimeSignature
                            ),

                        isRest: false,

                        measureNumber:
                            measureIndex + 1,

                        keySignature:
                            currentKeySignature,

                        timeSignature:
                            currentTimeSignature,
                    });
                }
            );
        }
    );

    return extractedNotes;
}