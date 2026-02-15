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

        // ---- TEMPO ----
        // tempo lives inside <sound tempo="120">
        const tempoNode = xml.querySelector("sound[tempo]");
        const tempo = tempoNode
            ? Number(tempoNode.getAttribute("tempo"))
            : null;

        // ---- TIME SIGNATURE ----
        const beats = xml.querySelector("time beats")?.textContent;
        const beatType = xml.querySelector("time beat-type")?.textContent;

        const timeSignature =
            beats && beatType ? `${beats}/${beatType}` : null;

        // ---- KEY SIGNATURE ----
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
