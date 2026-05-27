const noteMap = {
    "C": { step: "C", alter: 0 },
    "C#": { step: "C", alter: 1 },
    "Db": { step: "D", alter: -1 },

    "D": { step: "D", alter: 0 },
    "D#": { step: "D", alter: 1 },
    "Eb": { step: "E", alter: -1 },

    "E": { step: "E", alter: 0 },

    "F": { step: "F", alter: 0 },
    "F#": { step: "F", alter: 1 },
    "Gb": { step: "G", alter: -1 },

    "G": { step: "G", alter: 0 },
    "G#": { step: "G", alter: 1 },
    "Ab": { step: "A", alter: -1 },

    "A": { step: "A", alter: 0 },
    "A#": { step: "A", alter: 1 },
    "Bb": { step: "B", alter: -1 },

    "B": { step: "B", alter: 0 },
};

export function generateMusicXML(note) {
    const isEmpty = !note;

    const mapped = note ? noteMap[note.name] : null;

    const noteXML = isEmpty
        ? `
        <note>
          <rest/>
          <duration>4</duration>
          <voice>1</voice>
          <type>whole</type>
        </note>
        `
        : `
        <note>
          <pitch>
            <step>${mapped.step}</step>
            ${mapped.alter !== 0 ? `<alter>${mapped.alter}</alter>` : ""}
            <octave>${note.octave}</octave>
          </pitch>
          <duration>4</duration>
          <voice>1</voice>
          <type>whole</type>
        </note>
        `;

    return `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC
"-//Recordare//DTD MusicXML 3.1 Partwise//EN"
"http://www.musicxml.org/dtds/partwise.dtd">

<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>

  <part id="P1">
    <measure number="1">

      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>

      ${noteXML}

    </measure>
  </part>
</score-partwise>
`;
}