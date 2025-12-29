import { PROVIDERS, isValidProvider } from "@/lib/providers";
import { Badge } from "./ui/badge";

export const ProviderBadge = ({ provider }: { provider?: string }) => {
  if (!provider || !isValidProvider(provider)) {
    return null;
  }

  const { name, color } = PROVIDERS[provider];

  return (
    <Badge
      style={{
        backgroundColor: color["500"],
      }}
    >
      {name}
    </Badge>
  );
};
