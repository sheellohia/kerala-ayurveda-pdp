import { PdpExperience } from '@/components/PdpExperience';

/**
 * Home route — the Kerala Ayurveda Ashwagandha product detail page.
 * All interactivity (variant selection, fit-check, cart) lives in the client
 * composition; this stays a thin server component.
 */
export default function Home() {
  return <PdpExperience />;
}
