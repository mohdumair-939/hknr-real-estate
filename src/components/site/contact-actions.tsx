import { MessageCircle, Phone } from "lucide-react";
import { ButtonAnchor } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatPhoneDisplay, telHref, whatsappHref } from "@/lib/format";
import type { PublicSettings } from "@/lib/queries/public";

/**
 * Call / WhatsApp buttons. Each renders only when the business has entered a verified
 * number in admin settings; nothing is shown otherwise, never a placeholder number.
 */
export function ContactActions({
  settings,
  whatsappMessage,
  className,
  size = "lg",
  stacked = false,
}: {
  settings: Pick<PublicSettings, "phone" | "whatsapp">;
  whatsappMessage?: string;
  className?: string;
  size?: "md" | "lg";
  stacked?: boolean;
}) {
  const wa = settings.whatsapp ?? null;
  if (!settings.phone && !wa) return null;
  return (
    <div className={cn("flex gap-3", stacked ? "flex-col" : "flex-wrap", className)}>
      {settings.phone ? (
        <ButtonAnchor href={telHref(settings.phone)} variant="secondary" size={size} className={stacked ? "w-full" : undefined}>
          <Phone aria-hidden="true" />
          <span>
            Call <span className="sr-only">HKNR on </span>
            <span className="whitespace-nowrap">{formatPhoneDisplay(settings.phone)}</span>
          </span>
        </ButtonAnchor>
      ) : null}
      {wa ? (
        <ButtonAnchor
          href={whatsappHref(wa, whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
          size={size}
          className={stacked ? "w-full" : undefined}
        >
          <MessageCircle aria-hidden="true" />
          WhatsApp<span className="sr-only"> HKNR (opens WhatsApp)</span>
        </ButtonAnchor>
      ) : null}
    </div>
  );
}
