import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Startups() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/StartupsPage');
  }, [router]);

  return null;
}