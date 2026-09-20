"use client";

import { useActionState } from "react";
import { handleTransfer, type TransferAdminState } from "./actions";

export function TransferButtons({ id }: { id: string }) {
  const [state, action, pending] = useActionState<TransferAdminState, FormData>(
    handleTransfer,
    {}
  );

  return (
    <form action={action} className="row">
      {state.error ? <div className="flag hold">{state.error}</div> : null}
      <input type="hidden" name="transfer_id" value={id} />
      <button className="btn btn-ghost" name="decision" value="arranged" disabled={pending}>
        Arranging it
      </button>
      <button className="btn btn-primary" name="decision" value="done" disabled={pending}>
        Move them now
      </button>
      <button className="btn btn-ghost" name="decision" value="declined" disabled={pending}>
        Not possible
      </button>
    </form>
  );
}