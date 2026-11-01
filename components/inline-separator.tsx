import { Dot } from "lucide-react";

export function InlineSeparator() {
  return (
    <>
      {" "}
      <Dot
        aria-hidden="true"
        className="mx-1 inline-block size-3.5 shrink-0 align-middle"
      />{" "}
    </>
  );
}
