export function QrScanView({
  qrCode,
  error,
  onCancel,
}: {
  qrCode: string;
  error: string | null;
  onCancel: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div className="text-sm font-medium text-[#a6adc8]">Scan with BankID</div>
      <img src={qrCode} alt="BankID QR" className="size-40 rounded-lg bg-white p-2" />
      <div className="text-xs text-[#6c7086]">Open BankID on your phone</div>
      <button
        className="w-full rounded-lg bg-[#313244] px-3 py-2 text-sm text-[#a6adc8] transition-transform active:scale-95"
        onClick={onCancel}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Cancel
      </button>
      {error && <div className="text-xs text-[#f38ba8]">{error}</div>}
    </div>
  );
}

export function LoginStartView({
  starting,
  error,
  onStart,
}: {
  starting: boolean;
  error: string | null;
  onStart: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <div className="text-sm font-medium text-[#a6adc8]">ICA Login</div>
      <button
        className="w-full rounded-lg bg-[#89b4fa] px-3 py-2 text-sm font-bold text-[#181825] transition-transform active:scale-95 disabled:opacity-50"
        onClick={onStart}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={starting}
      >
        {starting ? "Starting..." : "Log in with BankID"}
      </button>
      {error && <div className="text-xs text-[#f38ba8]">{error}</div>}
    </div>
  );
}
