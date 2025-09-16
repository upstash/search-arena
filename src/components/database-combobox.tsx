"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProviderBadge } from "./provider-badge";
import { Database } from "@/api/trpc/types";

interface DatabaseComboboxProps {
  databases: Database[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabledValue?: string;
  className?: string;
}

export function DatabaseCombobox({
  databases,
  value,
  onValueChange,
  placeholder = "Select database...",
  disabledValue,
  className,
}: DatabaseComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDatabase = databases.find((database) => database.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {selectedDatabase ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedDatabase.label}</span>
              <ProviderBadge provider={selectedDatabase.provider} />
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0">
        <Command>
          <CommandInput placeholder="Search databases..." />
          <CommandList>
            <CommandEmpty>No database found.</CommandEmpty>
            <CommandGroup>
              {databases.map((database) => (
                <CommandItem
                  key={database.id}
                  value={database.label}
                  onSelect={() => {
                    onValueChange(database.id === value ? "" : database.id);
                    setOpen(false);
                  }}
                  disabled={database.id === disabledValue}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === database.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate">{database.label}</span>
                    <ProviderBadge provider={database.provider} />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
