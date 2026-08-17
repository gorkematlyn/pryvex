import { queryOne } from "@/lib/db/pool";
import type { BioPageRow } from "@/lib/db/types";

export function getPrimaryBioPage(profileId: string): Promise<BioPageRow | null> {
  return queryOne<BioPageRow>("select * from bio_pages where profile_id = $1 and is_primary = true", [profileId]);
}

export function getPublishedPrimaryBioPage(profileId: string): Promise<BioPageRow | null> {
  return queryOne<BioPageRow>(
    "select * from bio_pages where profile_id = $1 and is_primary = true and is_published = true",
    [profileId],
  );
}

export function getBioPageById(id: string): Promise<BioPageRow | null> {
  return queryOne<BioPageRow>("select * from bio_pages where id = $1", [id]);
}
