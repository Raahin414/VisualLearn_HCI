import { conditions, type Condition } from "@/lib/content/lesson";

export { conditions };
export type { Condition };
export type Course = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  steps: { title: string; body: string; labels: [string, string, string] }[];
  questions: { prompt: string; options: [string, string, string, string] }[];
};
export const courses: Course[] = [
  {
    slug: "water-cycle", title: "The Water Cycle", category: "Earth science",
    summary: "Follow water as it moves between land, water, and the atmosphere.",
    steps: [
      { title: "Evaporation", body: "Energy from the Sun changes some liquid water at Earth's surface into invisible water vapor. Evaporation can happen from oceans, lakes, rivers, and wet soil without the water boiling.", labels: ["Sunlight", "Liquid water", "Water vapor"] },
      { title: "Condensation", body: "When moist air cools, water vapor can change into tiny liquid droplets. Many droplets together can form a cloud. The water on the outside of a cold glass is another example of condensation.", labels: ["Moist air", "Cooling", "Droplets"] },
      { title: "Precipitation and collection", body: "Water returns to the surface as rain, snow, sleet, or hail. It can flow downhill into rivers and lakes, soak into soil, or remain frozen. Collected water may later evaporate again.", labels: ["Cloud water", "Precipitation", "Collection"] },
    ],
    questions: [
      { prompt: "What supplies energy for evaporation?", options: ["The Sun", "Gravity", "Soil", "Clouds"] },
      { prompt: "What is condensation?", options: ["Rain falling", "Vapor changing into liquid droplets", "Water soaking into soil", "Ice melting"] },
      { prompt: "Which is an example of precipitation?", options: ["Water vapor", "Runoff", "Snowfall", "Evaporation"] },
      { prompt: "Where can water go after it reaches land?", options: ["Only into clouds", "Only into oceans", "It stops moving", "Into rivers or soil"] },
    ],
  },
  {
    slug: "photosynthesis", title: "Photosynthesis", category: "Life science",
    summary: "See how plants use light to make food.",
    steps: [
      { title: "What plants take in", body: "Plants absorb water through their roots and take in carbon dioxide from the air through their leaves. These materials are needed to make sugars. The Sun provides light energy.", labels: ["Water", "Carbon dioxide", "Light"] },
      { title: "Making sugar", body: "Chlorophyll in plant cells absorbs light. Plants use that energy to combine water and carbon dioxide into glucose, a sugar. This process is called photosynthesis.", labels: ["Light energy", "Leaf cells", "Glucose"] },
      { title: "What plants release", body: "Photosynthesis releases oxygen into the air. Plants use some of the glucose for energy and build other substances from it. More light alone cannot replace water or carbon dioxide.", labels: ["Glucose", "Plant growth", "Oxygen"] },
    ],
    questions: [
      { prompt: "Which gas do plants take in for photosynthesis?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Helium"] },
      { prompt: "What provides energy for photosynthesis?", options: ["Gravity", "Wind", "Light", "Soil"] },
      { prompt: "What sugar is made during photosynthesis?", options: ["Glucose", "Salt", "Starch only", "Protein"] },
      { prompt: "Which gas is released?", options: ["Carbon dioxide", "Hydrogen", "Nitrogen", "Oxygen"] },
    ],
  },
  {
    slug: "electric-circuits", title: "Electric Circuits", category: "Physical science",
    summary: "Understand how a simple closed circuit works.",
    steps: [
      { title: "A complete path", body: "An electric circuit is a path through which electric charge can move. A battery can provide a potential difference that drives current. A simple circuit needs a complete path from one battery terminal through components to the other terminal.", labels: ["Battery", "Wire", "Complete loop"] },
      { title: "Components", body: "A lamp changes electrical energy into light and heat. A switch can open or close the path. When the switch is open, the path is broken and the lamp goes out.", labels: ["Switch", "Lamp", "Current"] },
      { title: "Series and parallel", body: "Components in series share one path, so a break anywhere stops current through that path. Parallel branches provide more than one path. A break in one branch does not necessarily stop current in another branch.", labels: ["One path", "Branches", "Different behavior"] },
    ],
    questions: [
      { prompt: "What does a simple circuit need for current to flow?", options: ["A complete path", "An open switch", "Two lamps", "A magnet"] },
      { prompt: "What happens when a switch opens a single-loop circuit?", options: ["The lamp brightens", "Current in that path stops", "The battery disappears", "Current doubles"] },
      { prompt: "What can a battery provide?", options: ["Sunlight", "Water", "Potential difference", "Gravity"] },
      { prompt: "How many paths can parallel branches provide?", options: ["None", "Exactly one", "Only one-way", "More than one"] },
    ],
  },
  {
    slug: "human-digestion", title: "Human Digestion", category: "Life science",
    summary: "Trace how food is broken down and nutrients are absorbed.",
    steps: [
      { title: "Mouth and esophagus", body: "Chewing breaks food into smaller pieces. Saliva helps moisten food and begins breaking down starch. Swallowing moves food down the esophagus to the stomach.", labels: ["Chewing", "Saliva", "Esophagus"] },
      { title: "Stomach and small intestine", body: "The stomach churns food and mixes it with acid and enzymes. In the small intestine, digestion continues and most nutrients pass into the blood through the intestinal lining.", labels: ["Stomach", "Small intestine", "Nutrients"] },
      { title: "Large intestine", body: "The large intestine absorbs much of the remaining water. Material that cannot be digested is eventually removed from the body. Digestion and absorption are related but different processes.", labels: ["Remaining material", "Water absorbed", "Waste removed"] },
    ],
    questions: [
      { prompt: "Where does chewing begin digestion?", options: ["Mouth", "Stomach", "Large intestine", "Liver"] },
      { prompt: "What carries swallowed food to the stomach?", options: ["Trachea", "Esophagus", "Small intestine", "Pancreas"] },
      { prompt: "Where are most nutrients absorbed?", options: ["Mouth", "Stomach", "Small intestine", "Large intestine"] },
      { prompt: "What does the large intestine absorb?", options: ["Sunlight", "Oxygen", "Most nutrients", "Much of the remaining water"] },
    ],
  },
  {
    slug: "solar-system", title: "The Solar System", category: "Space science",
    summary: "Explore orbits, rotation, and the Sun's role.",
    steps: [
      { title: "The Sun and planets", body: "The Sun is a star at the center of our solar system. Eight planets orbit it. Gravity keeps planets moving along their orbits, while the planets' motion prevents them from falling straight into the Sun.", labels: ["Sun", "Gravity", "Planet orbit"] },
      { title: "Rotation and day", body: "Earth rotates around its axis about once every 24 hours. The side facing the Sun experiences daylight while the opposite side experiences night. Rotation is different from Earth's orbit around the Sun.", labels: ["Earth's axis", "Rotation", "Day and night"] },
      { title: "Orbit and year", body: "Earth travels around the Sun in about one year. Earth's tilted axis, combined with this orbit, causes the seasons. The seasons are not mainly caused by Earth being nearer to or farther from the Sun.", labels: ["Orbit", "Tilted axis", "Seasons"] },
    ],
    questions: [
      { prompt: "What is the Sun?", options: ["A star", "A planet", "A moon", "A comet"] },
      { prompt: "What chiefly causes day and night?", options: ["Earth's yearly orbit", "Earth's rotation", "The Moon's orbit", "Seasonal change"] },
      { prompt: "About how long does Earth take to orbit the Sun?", options: ["One day", "One week", "One year", "Ten years"] },
      { prompt: "What helps cause Earth's seasons?", options: ["The Moon's shape", "Daily weather", "The Sun moving around Earth", "Earth's tilted axis"] },
    ],
  },
];

export function getCourse(slug: string) { return courses.find((course) => course.slug === slug); }
export function isCondition(value: string): value is Condition { return conditions.includes(value as Condition); }
