// Sample municipal code corpus for the RAG engine.
// Each entry is a code section that the retriever can cite.
// In production, swap this for a vector DB of your actual code book.

const MUNICIPAL_CODE = [
  {
    id: "FAR-R2",
    zone: "R-2",
    title: "Floor Area Ratio (R-2 Medium-Density Residential)",
    body:
      "In R-2 districts, the maximum floor area ratio (FAR) is 1.2 for lots " +
      "up to 5,000 sq ft and 1.5 for lots between 5,001 and 10,000 sq ft. " +
      "Larger lots are capped at 1.8. Garage space is excluded from FAR " +
      "calculations when located entirely below grade."
  },
  {
    id: "HEIGHT-R2",
    zone: "R-2",
    title: "Height Limit (R-2)",
    body:
      "No structure in an R-2 district may exceed 35 feet in height, " +
      "measured from grade to the midpoint of the roof. Flat roofs are " +
      "permitted a 5-foot parapet above the 35-foot limit. Mechanical " +
      "penthouses may extend up to 50 feet if set back 15 feet from all " +
      "exterior walls."
  },
  {
    id: "SETBACK-R2",
    zone: "R-2",
    title: "Setbacks (R-2)",
    body:
      "Front yard setback: 15 feet minimum. Side yard setback: 5 feet " +
      "minimum on each side, 10 feet total. Rear yard setback: 20 feet " +
      "minimum. Corner lots require an additional 5-foot setback on the " +
      "side street. Setbacks are measured from the property line to the " +
      "nearest point of the structure."
  },
  {
    id: "PARKING-R2",
    zone: "R-2",
    title: "Off-Street Parking (R-2)",
    body:
      "R-2 districts require 1.5 off-street parking spaces per dwelling " +
      "unit, with at least 0.25 spaces per unit designated for visitors. " +
      "Tandem parking is allowed for the residential portion of a duplex " +
      "or townhouse. Garages must be accessed from the alley where one " +
      "exists."
  },
  {
    id: "FAR-C1",
    zone: "C-1",
    title: "Floor Area Ratio (C-1 Neighborhood Commercial)",
    body:
      "In C-1 districts, the maximum FAR is 2.0. Mixed-use developments " +
      "with ground-floor retail receive a 0.3 FAR bonus. Parking structures " +
      "are excluded from FAR if wrapped by active uses on at least 60% " +
      "of the ground-floor facade."
  },
  {
    id: "HEIGHT-C1",
    zone: "C-1",
    title: "Height Limit (C-1)",
    body:
      "C-1 structures may not exceed 45 feet or 3 stories, whichever is " +
      "less. A 10-foot step-back is required above the second story on " +
      "any facade facing a residential zone."
  },
  {
    id: "SETBACK-C1",
    zone: "C-1",
    title: "Setbacks (C-1)",
    body:
      "C-1 districts have no minimum front setback, but a 10-foot sidewalk " +
      "easement is required. Side and rear setbacks must be 10 feet when " +
      "the property abuts a residential zone; otherwise 0 feet is allowed."
  },
  {
    id: "PARKING-C1",
    zone: "C-1",
    title: "Off-Street Parking (C-1)",
    body:
      "C-1 districts require 1 space per 300 sq ft of retail and 1 space " +
      "per dwelling unit for residential uses. A 30% reduction is " +
      "available for properties within 1/4 mile of a transit stop with " +
      "headways of 15 minutes or less."
  },
  {
    id: "USE-MIX",
    zone: "ALL",
    title: "Allowed Uses by Zone",
    body:
      "R-2 allows single-family, duplex, and townhouse dwellings; " +
      "accessory dwelling units (ADUs) up to 800 sq ft; and home " +
      "occupations. C-1 allows retail, restaurant, office, and " +
      "residential above the ground floor. Industrial uses are " +
      "prohibited in both R-2 and C-1."
  },
  {
    id: "FLOOD",
    zone: "ALL",
    title: "Flood Hazard Overlay",
    body:
      "Construction within a 100-year floodplain requires a Floodplain " +
      "Development Permit and elevation of the lowest floor to at least " +
      "2 feet above the base flood elevation. Critical facilities " +
      "(hospitals, fire stations) must be elevated 3 feet above BFE."
  },
  {
    id: "SEISMIC",
    zone: "ALL",
    title: "Seismic Design Category",
    body:
      "New structures must comply with the seismic design category " +
      "mapped for the parcel. Categories range from A (lowest) to F " +
      "(highest). A geotechnical investigation is required for any " +
      "structure in category D or higher."
  },
  {
    id: "PERMITS",
    zone: "ALL",
    title: "Permit Triggers",
    body:
      "A Building Permit is required for any new structure or " +
      "modification over 120 sq ft. A Demolition Permit is required " +
      "before removing any structure over 40 years old. A Grading " +
      "Permit is required for any earthwork over 50 cubic yards. A " +
      "Tree Removal Permit is required for any protected species tree."
  }
];

module.exports = { MUNICIPAL_CODE };
