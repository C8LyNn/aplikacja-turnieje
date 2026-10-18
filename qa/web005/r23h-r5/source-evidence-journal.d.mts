export interface EventReceipt { path: string; sha256: string }
export declare function persistSafetyEvent(event: {
  event: string; slot: string; run_id: string; cluster_cert_sha256: string;
  [key: string]: string;
}): EventReceipt;
export declare function verifyPersistedEvent(receipt: EventReceipt, expected: Record<string,string>): true;
