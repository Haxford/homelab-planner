/** Common rack sizes, with rough prices for the empty enclosure. */
export const RACK_PRESETS: {
  id: string;
  name: string;
  heightU: number;
  price: number;
  notes: string;
}[] = [
  { id: "42u", name: "42U full-height cabinet", heightU: 42, price: 400, notes: "600x1000mm floor-standing. Usually cheapest second-hand and collected in person." },
  { id: "27u", name: "27U cabinet", heightU: 27, price: 300, notes: "Half-height floor cabinet — fits under a desk or in a cupboard." },
  { id: "18u", name: "18U wall cabinet", heightU: 18, price: 220, notes: "Wall-mounted. Check the depth before buying anything 1U and deep." },
  { id: "12u", name: "12U wall cabinet", heightU: 12, price: 160, notes: "The usual starter cabinet." },
  { id: "9u", name: "9U wall cabinet", heightU: 9, price: 120, notes: "Fine for a gateway, a switch and a couple of shelves." },
  { id: "6u", name: "6U desktop rack", heightU: 6, price: 90, notes: "Open frame, sits on a desk." },
  { id: "4u", name: "4U open frame", heightU: 4, price: 60, notes: "Minimal — bolt it to a wall or a shelf." },
];
