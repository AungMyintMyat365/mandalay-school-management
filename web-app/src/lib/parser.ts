export type StudentInfo = {
    name: string;
    coach?: string;
};

export type ClassData = {
    students: StudentInfo[];
    dates: ClassDateEntry[];
};

export type ClassDateEntry = {
    date: string;
    rowStart: number;
    rowEnd: number;
    studentData: Record<string, StudentDailyProgress>;
};

export type StudentDailyProgress = {
    specialization?: string;
    level?: string;
    finishedLessons?: string;
    upcomingLessons?: string;
    homework?: string;
    homeworkLink?: string;
    username?: string;
    password?: string;
    comments?: string;
    performance?: string;
};

export function parseClassData(rawData: any[][]): ClassData {
    if (!rawData || rawData.length < 2) {
        return { students: [], dates: [] };
    }

    // Row 0: Coach Names? (Usually sparsely populated, e.g. Col 2 "Coach Morgan", Col 3-5 empty but implied)
    // Row 1: Student Names (Col 2+)

    // We assume the first row with "Date" in col 0 is the Student Header Row.
    // The row ABOVE that is the Coach Header Row.

    let studentHeaderRowIndex = -1;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
        if (rawData[i][0]?.toString().toLowerCase().includes("date") ||
            rawData[i][1]?.toString().toLowerCase().includes("coder")) {
            studentHeaderRowIndex = i;
            break;
        }
    }

    if (studentHeaderRowIndex === -1) return { students: [], dates: [] };

    const studentRow = rawData[studentHeaderRowIndex];
    const coachRow = studentHeaderRowIndex > 0 ? rawData[studentHeaderRowIndex - 1] : null;

    const students: StudentInfo[] = [];
    let currentCoach = "Unknown Coach";

    // Students start from Col 2 (Index 2)
    for (let i = 2; i < studentRow.length; i++) {
        const studentName = studentRow[i]?.toString();
        if (studentName) {
            // Check coach row for this column
            const coachCell = coachRow ? coachRow[i]?.toString() : null;
            if (coachCell && coachCell.trim() !== "") {
                currentCoach = coachCell;
            }

            students.push({
                name: studentName,
                coach: currentCoach
            });
        }
    }

    const dates: ClassDateEntry[] = [];
    let currentDateEntry: ClassDateEntry | null = null;

    // Iterate rows starting after header
    for (let i = studentHeaderRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        const dateCell = row[0]?.toString();
        const fieldLabel = row[1]?.toString();

        if (dateCell && dateCell.trim() !== "") {
            if (currentDateEntry) {
                dates.push(currentDateEntry);
            }
            currentDateEntry = {
                date: dateCell,
                rowStart: i,
                rowEnd: i,
                studentData: {}
            };
            students.forEach(s => {
                if (currentDateEntry) currentDateEntry.studentData[s.name] = {};
            });
        }

        if (currentDateEntry && fieldLabel) {
            currentDateEntry.rowEnd = i;
            students.forEach((student, sIdx) => {
                const cellValue = row[sIdx + 2];
                const fieldKey = mapFieldToKey(fieldLabel);
                if (fieldKey && currentDateEntry) {
                    // @ts-ignore
                    currentDateEntry.studentData[student.name][fieldKey] = cellValue;
                }
            });
        }
    }

    if (currentDateEntry) {
        dates.push(currentDateEntry);
    }

    return { students, dates };
}

function mapFieldToKey(label: string): keyof StudentDailyProgress | null {
    if (!label) return null;
    const l = label.toLowerCase();
    if (l.includes("specialization")) return "specialization";
    if (l.includes("level")) return "level";
    if (l.includes("finish")) return "finishedLessons";
    if (l.includes("upcoming")) return "upcomingLessons";
    if (l.includes("homework link")) return "homeworkLink";
    if (l.includes("homework") && !l.includes("link")) return "homework";
    if (l.includes("username")) return "username";
    if (l.includes("password")) return "password";
    if (l.includes("performance")) return "performance";
    return null;
}
