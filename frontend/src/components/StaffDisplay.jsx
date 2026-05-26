import { useState, useEffect } from "react";

import TrebleStaff from "../assets/treble_clef.svg?react";
import BassStaff from "../assets/bass_clef.svg?react";
import NoteHead from "../assets/quarter_note.svg?react";
import Sharp from "../assets/sharp.svg?react";
import Flat from "../assets/flat.svg?react";

import { getStaffInfo, STAFF_LIMITS } from "../utils/staffMap";

export default function StaffDisplay({ note }) {

    const staffInfo = getStaffInfo(note);

    const [lastClef, setLastClef] = useState("treble");

    useEffect(() => {
        if (staffInfo) setLastClef(staffInfo.clef);
    }, [staffInfo]);

    const clef = staffInfo?.clef ?? lastClef;
    const useBass = clef === "bass";

    const STEP_HEIGHT = 12;
    const CENTER_Y = 72;      // B4 anchor

    const y =
        staffInfo
            ? CENTER_Y - staffInfo.steps * STEP_HEIGHT
            : CENTER_Y;

    const ledgerLines = [];

    if (staffInfo) {
        const steps = staffInfo.steps;

        const TOP_LINE = 4;
        const BOTTOM_LINE = -4;

        if (steps > TOP_LINE) {

            let start =
                (TOP_LINE % 2 === 0)
                    ? TOP_LINE + 2
                    : TOP_LINE + 1;

            for (let s = start; s <= steps; s += 2) {
                ledgerLines.push(
                    CENTER_Y - s * STEP_HEIGHT + 13
                );
            }
        }

        if (steps < BOTTOM_LINE) {

            let start =
                (BOTTOM_LINE % 2 === 0)
                    ? BOTTOM_LINE - 2
                    : BOTTOM_LINE - 1;

            for (let s = start; s >= steps; s -= 2) {
                ledgerLines.push(
                    CENTER_Y - s * STEP_HEIGHT + STEP_HEIGHT / 2
                );
            }
        }
    }

    return (
        <div className="score-container">
            <div className="staff-wrapper">

                {useBass
                    ? <BassStaff className="staff-svg" />
                    : <TrebleStaff className="staff-svg" />
                }

                {note && ledgerLines.map((ly, i) => (
                    <div
                        key={i}
                        className="ledger-line"
                        style={{ top: `${ly}px` }}
                    />
                ))}

                {note && (
                    <>
                        <NoteHead
                            className="note-head"
                            style={{
                                position: "absolute",
                                top: `${y}px`,
                                left: "50%",
                                transform: "translate(-50%, -50%)"
                            }}
                        />

                        {staffInfo.accidental === "sharp" && (
                            <Sharp
                                style={{
                                    position: "absolute",
                                    top: `${y}px`,
                                    left: "42%",
                                    transform: "translate(-50%, -50%)"
                                }}
                            />
                        )}

                        {staffInfo.accidental === "flat" && (
                            <Flat
                                style={{
                                    position: "absolute",
                                    top: `${y}px`,
                                    left: "42%",
                                    transform: "translate(-50%, -50%)"
                                }}
                            />
                        )}
                    </>
                )}

            </div>
        </div>
    );
}