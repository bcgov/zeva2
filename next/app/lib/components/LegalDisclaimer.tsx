import { StatusBanner } from "./StatusBanner";

export const LegalDisclaimer = () => (
  <aside className="px-6 pb-6" aria-label="Legal disclaimer">
    <StatusBanner
      title="Legal disclaimer:"
      variant="info"
      primaryText={
        <>
          This information does not replace or constitute legal advice. Users
          are responsible for ensuring compliance with the{" "}
          <em>Zero-Emission Vehicles Act</em> and <em>Regulations</em>.
        </>
      }
    />
  </aside>
);
