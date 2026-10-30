# Explore research and setup notes

Research checked on **8 October 2026**. Imported geography and attraction candidates retain their source URLs and review state in the database.

## Barangays

Barangay names and PSGC identifiers were checked against the Philippine Statistics Authority [Tanjay City barangay directory](https://psa.gov.ph/classification/psgc/barangays/1804621000). The PSA directory states that its listed barangay count is current as of 31 July 2025. The 24 imported name/code pairs are marked `verified`; their descriptions, hall addresses, public contacts, hours, and coordinates remain blank until verified by the LGU. The checked date records when this source was checked, not a claim that hall details have been verified.

## Tourist destination candidates

These five research candidates are seeded as drafts with `awaiting_review` status, source links, and cautious descriptions. They are not an official ranking. The public Tourist Spots directory now displays them with an **Under review** label and does not expose visitor details or precise map coordinates until verified and published:

- Tanjay Boardwalk / Mangrove Forest
- Luparan Falls
- Pal-ew Lake
- Saint James the Greater Parish
- Rizal Park

The candidate list is derived from a [third-party Tanjay tourism reference](https://dumaguete.com/tanjay-city-negros-oriental/tourist-spots-in-tanjay/). References supplied for the boardwalk include [PNA article 1019003](https://www.pna.gov.ph/articles/1019003) and [PNA article 1082772](https://www.pna.gov.ph/articles/1082772); those pages could not be independently retrieved during implementation, so they remain references awaiting review. No hours, fees, access claims, images, or destination coordinates were imported.

The map's initial city framing uses the approximate locality center listed by [PhilAtlas](https://www.philatlas.com/visayas/r07/negros-oriental/tanjay.html), only to frame the city map. It is not stored as a barangay or destination location and is not used for directions.

## Leaflet map setup

The Explore City Map and verified tourist detail map load Leaflet on demand through React Leaflet. The initial tile layer uses the standard OpenStreetMap raster endpoint for local development and low-volume demonstrations. The tile URL and attribution are configurable; the visible Leaflet attribution control remains on screen at desktop and mobile widths. Selecting a location or result keeps the user in the Leaflet map; the Explore map does not send users to Google Maps.

React 19 is used by this project. Stable compatible package versions are Leaflet 1.9.4, React Leaflet 5.0.0, and `@types/leaflet` 1.9.22. Install them with:

```bash
npm install leaflet@^1.9.4 react-leaflet@^5.0.0
npm install -D @types/leaflet@^1.9.22
```

Leaflet's stylesheet is imported by `resources/js/app.tsx`. Each React Leaflet map has an explicit height, and custom div markers avoid Vite image path issues.

Configure the Laravel map settings in `.env` (and in the deployment environment):

```dotenv
EXPLORE_MAP_CENTER_LAT=9.5162
EXPLORE_MAP_CENTER_LNG=123.1573
EXPLORE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
EXPLORE_MAP_TILE_ATTRIBUTION='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
EXPLORE_MAP_MIN_ZOOM=0
EXPLORE_MAP_MAX_ZOOM=19
EXPLORE_ROUTE_ENABLED=true
EXPLORE_ROUTE_SERVICE_URL=https://router.project-osrm.org/route/v1/driving
EXPLORE_ROUTE_TIMEOUT_SECONDS=8
EXPLORE_ROUTE_MAX_ORIGIN_DISTANCE_KM=250
```

The center is only an approximate city framing point, based on the locality center noted above. It does not create a marker or represent a verified location. Set another reviewed center if needed. Categories and markers come from the PostgreSQL records that pass public eligibility and location verification checks. No city or barangay boundaries are inferred or drawn. No Google Maps page or JavaScript API credential is used.

The standard OpenStreetMap tile service is best-effort, has limited capacity, and is not an unlimited production tile service. Follow the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/): retain visible attribution, allow normal browser referrers, respect response cache headers, and request only tiles people are viewing. Do not bulk download or prefetch tiles. Before production, select a hosted tile provider whose terms and service limits suit expected traffic, or operate a tile service; replace the tile URL and attribution through environment configuration and follow that provider's policy. Keep the same attribution visible for the selected provider.

Interactive directions stay inside the Leaflet map. A visitor can use browser geolocation or click the map to mark a starting point, then the application draws a road route to a verified destination. When no verified destination pin exists, the visitor can drop a temporary, clearly labeled map point and route to that point. A temporary point is never saved to the tourist listing. Laravel validates verified destinations against public records; visitor-selected points are limited to the configured distance from the approximate city center. Requests are rate limited, and only the two coordinate pairs go to the configured OSRM-compatible routing service. The public OSRM demonstration server is suitable only for development and low-volume evaluation; configure a production routing provider or operated OSRM service before launch. The maximum route distance limits misuse of the public routing proxy and can be adjusted for the intended service area.

## Verification workflow

PSGC names/codes have their source and checked date. Hall information uses separate center and entrance coordinates; precise hall directions require a verified entrance coordinate and verification timestamp. Tourist destinations likewise keep destination coordinates separate from visitor entrance coordinates. A published record can still have unverified visitor details, but map markers and precise directions require `verification_status=verified`, a location verification timestamp, and coordinates. Research drafts are idempotently seeded with `firstOrCreate`, so re-running the seeder does not overwrite later edits.
