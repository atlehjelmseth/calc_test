import { NextRequest, NextResponse } from "next/server";

const BRREG_BASE = "https://data.brreg.no/enhetsregisteret/api/enheter";

interface BrregUnit {
  organisasjonsnummer: string;
  navn: string;
  slettedato?: string;
  naeringskode1?: { kode: string; beskrivelse: string };
  forretningsadresse?: {
    adresse?: string[];
    postnummer?: string;
    poststed?: string;
    kommune?: string;
  };
}

interface BrregResponse {
  _embedded?: { enheter: BrregUnit[] };
}

export interface CompanyResult {
  name: string;
  orgNumber: string;
  displayLabel: string;
  industry?: string;
  municipality?: string;
}

function toResults(units: BrregUnit[]): CompanyResult[] {
  return units
    .filter((u) => !u.slettedato)
    .map((u) => ({
      name: u.navn,
      orgNumber: u.organisasjonsnummer,
      displayLabel: `${u.navn} (${u.organisasjonsnummer})`,
      industry: u.naeringskode1?.beskrivelse,
      municipality: u.forretningsadresse?.poststed ?? u.forretningsadresse?.kommune,
    }));
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const cleanDigits = q.replace(/[\s.-]/g, "");
  const isFullOrgNumber = /^\d{9}$/.test(cleanDigits);

  const fetchOpts: RequestInit = {
    headers: { Accept: "application/json" },
    cache: "no-store",
  };

  try {
    if (isFullOrgNumber) {
      const res = await fetch(
        `${BRREG_BASE}?organisasjonsnummer=${cleanDigits}&size=5`,
        fetchOpts
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data: BrregResponse = await res.json();
      const units = data._embedded?.enheter ?? [];
      if (units.length > 0) return NextResponse.json(toResults(units));
    }

    const res = await fetch(
      `${BRREG_BASE}?navn=${encodeURIComponent(q)}&size=10`,
      fetchOpts
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const data: BrregResponse = await res.json();
    return NextResponse.json(toResults(data._embedded?.enheter ?? []));
  } catch {
    return NextResponse.json(
      { error: "Klarte ikke å hente data fra Brønnøysundregistrene" },
      { status: 502 }
    );
  }
}
