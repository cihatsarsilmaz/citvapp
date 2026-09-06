import React, { useEffect } from "react";

export default function Joy({ kind, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, kind === "bonus" ? 1080 : 560);
    return () => clearTimeout(t);
  }, [kind, onDone]);
  return <div className={"joy joy-" + kind} aria-hidden="true" />;
}
