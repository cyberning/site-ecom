"use client";

import { useState, useEffect } from "react";

interface Wilaya {
  code: string;
  name: string;
  nameAr: string;
}

interface Commune {
  code: string;
  name: string;
  nameAr: string;
  wilayaCode: string;
}

export function useWilaya() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState("");
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  useEffect(() => {
    fetch("/api/wilayas")
      .then((r) => r.json())
      .then((data) => {
        setWilayas(data);
        setLoadingWilayas(false);
      })
      .catch(() => setLoadingWilayas(false));
  }, []);

  useEffect(() => {
    if (!selectedWilaya) {
      setCommunes([]);
      return;
    }
    setLoadingCommunes(true);
    fetch(`/api/communes?wilayaCode=${selectedWilaya}`)
      .then((r) => r.json())
      .then((data) => {
        setCommunes(data);
        setLoadingCommunes(false);
      })
      .catch(() => setLoadingCommunes(false));
  }, [selectedWilaya]);

  return {
    wilayas,
    communes,
    selectedWilaya,
    setSelectedWilaya,
    loadingWilayas,
    loadingCommunes,
  };
}
