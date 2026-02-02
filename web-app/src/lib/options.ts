// Data extracted from Instruction Guide tab

export const SPECIALIZATIONS = [
    "Scratch",
    "Coding Scratch", // Alias or separate?
    "Khan Academy",
    "Trinket io",
    "Electronic Arduino",
    "Robotics Arduino",
    "App Lab",
    "TinkerCAD"
];

export const LEVELS = [
    "NEW RECRUIT",
    "Rookie", "Ro-Tinkercad2",
    "Trainee", "Tr-Touch Type",
    "Apprentice",
    "Enthusiast",
    "Professional",
    "Master",
    "Boss",
    "The Goat"
];

// Map Specialization -> Lessons
// Based on Instruction Guide Columns
export const LESSONS_BY_SPECIALIZATION: Record<string, string[]> = {
    "Scratch": [
        "Setting a Scene", "Setting a Scene Done", "Choose it yourself"
    ],
    "Coding Scratch": [ // If this exists
        "Setting a Scene", "Setting a Scene Done"
    ],
    "Khan Academy": [
        "JS3"
    ],
    "Trinket io": [
        "My Python"
    ],
    "Electronic Arduino": [
        "New Spark"
    ],
    "Robotics Arduino": [
        "Light up that car"
    ],
    "App Lab": [
        "App beginner"
    ],
    "TinkerCAD": [
        "3rd Dimension"
    ],
    // Default fallback
    "General": [
        "CSS everywhere"
    ]
};

export const CLASS_OPTIONS = {
    specialization: SPECIALIZATIONS,
    level: LEVELS,
    // Helper to get lessons
    getLessons: (spec?: string) => {
        if (!spec) return [];
        // Handle fuzzy matching or exact match
        const key = Object.keys(LESSONS_BY_SPECIALIZATION).find(k => spec.includes(k));
        return key ? LESSONS_BY_SPECIALIZATION[key] : [];
    }
};
