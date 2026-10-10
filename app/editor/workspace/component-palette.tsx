import { useMemo, useState } from "react";
import {
  componentsPalette,
  getComponentCategories,
  getComponentDefaultValues,
  isCoreComponent,
  renderComponentInsert,
  type ComponentSnippet,
  type ComponentSnippetField,
  type ComponentSnippetFormValue,
  type ComponentSnippetFormValues,
  type ComponentSnippetInsert,
  type ComponentSnippetRepeatableRow,
} from "../snippets";

export function ComponentPalette({
  onInsert,
  disabled,
}: {
  onInsert: (snippet: string | ComponentSnippetInsert) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );
  const [formValues, setFormValues] = useState<ComponentSnippetFormValues>({});

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const coreEntries = useMemo(
    () => componentsPalette.filter(isCoreComponent),
    []
  );
  const visibleEntries =
    showAdvanced || isSearching ? componentsPalette : coreEntries;
  const categories = useMemo(
    () => ["All", ...getComponentCategories(visibleEntries)],
    [visibleEntries]
  );
  const effectiveActiveCategory = categories.includes(activeCategory)
    ? activeCategory
    : "All";

  const filteredEntries = useMemo(() => {
    return visibleEntries.filter(entry => {
      if (
        effectiveActiveCategory !== "All" &&
        entry.category !== effectiveActiveCategory
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        entry.label,
        entry.hint,
        entry.category,
        ...(entry.searchTerms ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [effectiveActiveCategory, normalizedQuery, visibleEntries]);
  const grouped = useMemo(
    () => groupComponentSnippets(filteredEntries),
    [filteredEntries]
  );
  const selectedEntry = useMemo(
    () =>
      componentsPalette.find(entry => entry.id === selectedComponentId) ?? null,
    [selectedComponentId]
  );
  const configuredSnippet = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }

    return renderComponentInsert(selectedEntry, formValues);
  }, [formValues, selectedEntry]);

  function handleConfigure(entry: ComponentSnippet) {
    setSelectedComponentId(entry.id);
    setFormValues(getComponentDefaultValues(entry));
  }

  function handleQuickInsert(entry: ComponentSnippet) {
    onInsert(renderComponentInsert(entry));
  }

  function updateFormValue(fieldId: string, value: ComponentSnippetFormValue) {
    setFormValues(current => ({
      ...current,
      [fieldId]: value,
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">
            Insert component
          </div>
          <div className="text-[11px] text-slate-500">
            Start with the writing essentials. Search includes the full catalog,
            and advanced components stay available when you need them.
          </div>
        </div>
        <a
          href="/editor/components"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Open component guide
        </a>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {showAdvanced || isSearching
              ? `${componentsPalette.length} components available`
              : `${coreEntries.length} writing essentials`}
          </div>
          <button
            type="button"
            data-testid="advanced-components-toggle"
            aria-pressed={showAdvanced}
            onClick={() => setShowAdvanced(current => !current)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            {showAdvanced
              ? "Show writing essentials"
              : `Show ${
                  componentsPalette.length - coreEntries.length
                } advanced components`}
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search all components, patterns, or props"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isActive = category === effectiveActiveCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredEntries.length} component
          {filteredEntries.length === 1 ? "" : "s"} match the current filters
          {isSearching && !showAdvanced
            ? ", including advanced components"
            : ""}
          .
        </div>
      </div>

      {selectedEntry?.fields?.length && configuredSnippet ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">
                {selectedEntry.label}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedEntry.hint}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedComponentId(null)}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 hover:bg-white"
            >
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {selectedEntry.fields.map(field => (
              <ComponentConfiguratorField
                key={field.id}
                field={field}
                value={formValues[field.id]}
                disabled={disabled}
                onChange={value => updateFormValue(field.id, value)}
              />
            ))}
          </div>

          {selectedEntry.notes?.length ? (
            <ul className="space-y-2 text-xs text-slate-500">
              {selectedEntry.notes.map(note => (
                <li
                  key={note}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 leading-6"
                >
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Insert Preview
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100 shadow-inner">
              <code>{configuredSnippet.content}</code>
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onInsert(configuredSnippet)}
              disabled={disabled}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Insert into body
            </button>
            <button
              type="button"
              onClick={() =>
                setFormValues(getComponentDefaultValues(selectedEntry))
              }
              disabled={disabled}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Reset defaults
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No components match the current search. Try another keyword or
            switch categories.
          </div>
        ) : null}

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              {category}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item: ComponentSnippet) => {
                const isSelected = item.id === selectedComponentId;
                const hasConfigurator = Boolean(item.fields?.length);

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm shadow-sm transition ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50/80"
                        : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.label}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {item.hint}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {hasConfigurator ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleConfigure(item)}
                            disabled={disabled}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Configure
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickInsert(item)}
                            disabled={disabled}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                          >
                            Quick insert
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onInsert(renderComponentInsert(item))}
                          disabled={disabled}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Insert
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentConfiguratorField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ComponentSnippetField;
  value: ComponentSnippetFormValue | undefined;
  disabled?: boolean;
  onChange: (value: ComponentSnippetFormValue) => void;
}) {
  const baseInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400";

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600">
        {field.label}
      </label>

      {field.type === "repeatable" ? (
        <RepeatableConfiguratorField
          field={field}
          value={Array.isArray(value) ? value : []}
          disabled={disabled}
          onChange={onChange}
        />
      ) : field.type === "textarea" ? (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          disabled={disabled}
          className={`${baseInputClass} resize-y`}
        />
      ) : field.type === "select" ? (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
          className={baseInputClass}
        >
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={event => onChange(event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
          />
          <span>Enabled</span>
        </label>
      ) : (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={baseInputClass}
        />
      )}

      {field.help ? (
        <p className="text-[11px] text-slate-500">{field.help}</p>
      ) : null}
    </div>
  );
}

function RepeatableConfiguratorField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ComponentSnippetField;
  value: ComponentSnippetRepeatableRow[];
  disabled?: boolean;
  onChange: (value: ComponentSnippetRepeatableRow[]) => void;
}) {
  const itemFields = field.itemFields ?? [];
  const minItems = field.minItems ?? 0;
  const baseInputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400";

  function createRow(): ComponentSnippetRepeatableRow {
    return itemFields.reduce<ComponentSnippetRepeatableRow>(
      (row, itemField) => {
        row[itemField.id] = itemField.defaultValue ?? "";
        return row;
      },
      {}
    );
  }

  function updateRow(index: number, fieldId: string, nextValue: string) {
    onChange(
      value.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [fieldId]: nextValue } : row
      )
    );
  }

  function moveRow(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) {
      return;
    }

    const next = [...value];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {value.map((row, index) => (
        <div
          key={`${field.id}-${index}`}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              {field.itemLabel ?? "Item"} {index + 1}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveRow(index, -1)}
                disabled={disabled || index === 0}
                aria-label={`Move ${field.itemLabel ?? "item"} ${index + 1} up`}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveRow(index, 1)}
                disabled={disabled || index === value.length - 1}
                aria-label={`Move ${field.itemLabel ?? "item"} ${
                  index + 1
                } down`}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((_, rowIndex) => rowIndex !== index))
                }
                disabled={disabled || value.length <= minItems}
                aria-label={`Remove ${field.itemLabel ?? "item"} ${index + 1}`}
                className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_minmax(0,0.8fr)]">
            {itemFields.map(itemField => (
              <label key={itemField.id} className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {itemField.label}
                </span>
                <input
                  type="text"
                  value={row[itemField.id] ?? ""}
                  onChange={event =>
                    updateRow(index, itemField.id, event.target.value)
                  }
                  placeholder={itemField.placeholder}
                  disabled={disabled}
                  className={baseInputClass}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, createRow()])}
        disabled={disabled}
        className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        {field.addLabel ?? "Add item"}
      </button>
    </div>
  );
}

function groupComponentSnippets(entries: ComponentSnippet[]) {
  return entries.reduce<Record<string, ComponentSnippet[]>>((groups, entry) => {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }

    groups[entry.category].push(entry);
    return groups;
  }, {});
}
