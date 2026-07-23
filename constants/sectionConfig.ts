import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const SECTION_CONFIG: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: any;
    iconName: string;
    colors: [string, string];
  }
> = {
  resources: {
    title: "Study Materials",
    subtitle: "Notes, PDFs, reference books and downloadable resources.",
    icon: Ionicons,
    iconName: "document-text-outline",
    colors: ["#2563EB", "#1E3A8A"],
  },

  videos: {
    title: "Video Lectures",
    subtitle: "Watch high quality recorded lectures anytime.",
    icon: Ionicons,
    iconName: "play-circle-outline",
    colors: ["#9333EA", "#6D28D9"],
  },

  "mock-test": {
    title: "Mock Tests",
    subtitle: "Practice with chapter-wise and full length mock tests.",
    icon: MaterialCommunityIcons,
    iconName: "clipboard-text-outline",
    colors: ["#059669", "#065F46"],
  },

  "pyq-mock-test": {
    title: "PYQ Test",
    subtitle: "Solve previous year questions with detailed solutions.",
    icon: FontAwesome5,
    iconName: "history",
    colors: ["#EA580C", "#C2410C"],
  },

  "live-test": {
    title: "Live Tests",
    subtitle: "Join scheduled live exams and compete with students.",
    icon: Feather,
    iconName: "clock",
    colors: ["#DB2777", "#9D174D"],
  },
};

export default SECTION_CONFIG;
