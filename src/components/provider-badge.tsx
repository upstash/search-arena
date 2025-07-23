import { Provider, PROVIDERS } from "@/lib/providers";
import { Badge } from "./ui/badge";

export const ProviderBadge = ({ provider }: { provider?: Provider }) => {
  if (!provider) {
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
