"use client";

import { useCallback, useEffect, useState } from "react";
import type { MenuCategory, MenuItem, SiteContent } from "@/lib/types";
import { WEEKDAY_LABELS } from "@/lib/schedule";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"main" | "schedule" | "menu" | "social" | "seo">("main");

  const loadAuth = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = (await res.json()) as { authenticated: boolean };
    setAuthenticated(data.authenticated);
  }, []);

  const loadContent = useCallback(async () => {
    const res = await fetch("/api/content");
    setContent((await res.json()) as SiteContent);
  }, []);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (authenticated) {
      loadContent();
    }
  }, [authenticated, loadContent]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthenticated(true);
      setPassword("");
    } else {
      setLoginError("Неверный пароль");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setContent(null);
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    setSaving(false);
    setMessage(res.ok ? "Сохранено" : "Ошибка сохранения");
  }

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateMenuCategory(index: number, category: MenuCategory) {
    if (!content) return;
    const categories = [...content.menu.categories];
    categories[index] = category;
    update("menu", { ...content.menu, categories });
  }

  function addCategory() {
    if (!content) return;
    update("menu", {
      ...content.menu,
      categories: [
        ...content.menu.categories,
        { id: uid(), name: "Новая категория", items: [] },
      ],
    });
  }

  function removeCategory(index: number) {
    if (!content) return;
    update("menu", {
      ...content.menu,
      categories: content.menu.categories.filter((_, i) => i !== index),
    });
  }

  function addMenuItem(categoryIndex: number) {
    if (!content) return;
    const category = content.menu.categories[categoryIndex];
    const item: MenuItem = {
      id: uid(),
      name: "Новая позиция",
      price: 0,
    };
    updateMenuCategory(categoryIndex, {
      ...category,
      items: [...category.items, item],
    });
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Загрузка…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 admin-bg">
        <form
          onSubmit={handleLogin}
          className="glass-card rounded-2xl p-8 w-full max-w-sm space-y-4"
        >
          <h1 className="font-display text-2xl font-bold text-center">
            Админ-панель
          </h1>
          <input
            type="password"
            className="input-field"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {loginError && (
            <p className="text-red-400 text-sm text-center">{loginError}</p>
          )}
          <button type="submit" className="btn-primary w-full">
            Войти
          </button>
        </form>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Загрузка контента…
      </div>
    );
  }

  const tabs = [
    { id: "main" as const, label: "Основное" },
    { id: "seo" as const, label: "SEO" },
    { id: "schedule" as const, label: "Расписание" },
    { id: "menu" as const, label: "Меню" },
    { id: "social" as const, label: "Ссылки" },
  ];

  const defaultSeo = {
    siteUrl: "https://parovoz39.ru",
    metaTitle: `${content?.title ?? ""} — кальянная`,
    metaDescription: content?.subtitle ?? "",
    keywords: "",
    ogImage: "",
  };
  const seo = { ...defaultSeo, ...content?.seo };

  return (
    <div className="min-h-screen admin-bg">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold">Админ-панель</h1>
          <div className="flex items-center gap-3">
            <a href="/admin/bookings" className="btn-ghost text-sm py-2 px-4">
              Бронирования
            </a>
            <a href="/" className="btn-ghost text-sm py-2 px-4">
              На сайт
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm py-2 px-4"
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <button onClick={handleLogout} className="btn-ghost text-sm py-2 px-4">
              Выйти
            </button>
          </div>
        </div>
        {message && (
          <p className="text-center text-sm pb-2 text-green-400">{message}</p>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "main" && (
          <div className="space-y-6">
            <Field label="Название">
              <input
                className="input-field"
                value={content.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </Field>
            <Field label="Подзаголовок">
              <input
                className="input-field"
                value={content.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </Field>
            <Field label="Адрес">
              <input
                className="input-field"
                value={content.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
            <Field label="Телефон">
              <input
                className="input-field"
                value={content.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </Field>
            <Field label="Цвет бренда">
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={content.theme.primaryColor}
                  onChange={(e) =>
                    update("theme", {
                      ...content.theme,
                      primaryColor: e.target.value,
                    })
                  }
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  className="input-field flex-1"
                  value={content.theme.primaryColor}
                  onChange={(e) =>
                    update("theme", {
                      ...content.theme,
                      primaryColor: e.target.value,
                    })
                  }
                />
              </div>
            </Field>
            <Field label="Текст 18+">
              <textarea
                className="input-field min-h-24 resize-y"
                value={content.legal.ageRestriction}
                onChange={(e) =>
                  update("legal", {
                    ...content.legal,
                    ageRestriction: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Яндекс.Метрика ID">
              <input
                className="input-field"
                value={content.yandexMetrikaId ?? ""}
                onChange={(e) => update("yandexMetrikaId", e.target.value)}
              />
            </Field>
          </div>
        )}

        {tab === "seo" && (
          <div className="space-y-6">
            <p className="text-muted text-sm">
              Настройки для поисковиков и превью в соцсетях. После HTTPS укажите
              полный URL с https://
            </p>
            <Field label="URL сайта (canonical)">
              <input
                className="input-field"
                value={seo.siteUrl}
                onChange={(e) =>
                  update("seo", { ...seo, siteUrl: e.target.value })
                }
                placeholder="https://parovoz39.ru"
              />
            </Field>
            <Field label="Заголовок (title)">
              <input
                className="input-field"
                value={seo.metaTitle}
                onChange={(e) =>
                  update("seo", { ...seo, metaTitle: e.target.value })
                }
              />
            </Field>
            <Field label="Описание (description)">
              <textarea
                className="input-field min-h-24 resize-y"
                value={seo.metaDescription}
                onChange={(e) =>
                  update("seo", { ...seo, metaDescription: e.target.value })
                }
              />
            </Field>
            <Field label="Ключевые слова (через запятую)">
              <input
                className="input-field"
                value={seo.keywords}
                onChange={(e) =>
                  update("seo", { ...seo, keywords: e.target.value })
                }
              />
            </Field>
            <Field label="Картинка для соцсетей (необязательно)">
              <input
                className="input-field"
                value={seo.ogImage}
                onChange={(e) =>
                  update("seo", { ...seo, ogImage: e.target.value })
                }
                placeholder="/og.jpg или https://..."
              />
              <p className="text-muted text-xs mt-1">
                Пусто — автокартинка /opengraph-image
              </p>
            </Field>
            <div className="glass-card rounded-xl p-4 text-sm text-muted space-y-1">
              <p>
                <strong className="text-foreground">robots.txt:</strong> /robots.txt
              </p>
              <p>
                <strong className="text-foreground">sitemap:</strong>{" "}
                {seo.siteUrl.replace(/\/$/, "")}/sitemap.xml
              </p>
            </div>
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-4">
            <p className="text-muted text-sm mb-4">
              Часы указываются в 24-часовом формате. Если закрытие после полуночи
              — укажите 25 для 01:00, 26 для 02:00 и т.д.
            </p>
            {content.schedule.days.map((day, i) => (
              <div
                key={WEEKDAY_LABELS[i]}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                <span className="w-8 font-medium">{WEEKDAY_LABELS[i]}</span>
                <input
                  type="number"
                  className="input-field w-24"
                  min={0}
                  max={47}
                  value={day.open}
                  onChange={(e) => {
                    const days = [...content.schedule.days];
                    days[i] = { ...day, open: Number(e.target.value) };
                    update("schedule", { ...content.schedule, days });
                  }}
                />
                <span className="text-muted">—</span>
                <input
                  type="number"
                  className="input-field w-24"
                  min={0}
                  max={47}
                  value={day.close}
                  onChange={(e) => {
                    const days = [...content.schedule.days];
                    days[i] = { ...day, close: Number(e.target.value) };
                    update("schedule", { ...content.schedule, days });
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {tab === "menu" && (
          <div className="space-y-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={content.menu.enabled}
                onChange={(e) =>
                  update("menu", { ...content.menu, enabled: e.target.checked })
                }
                className="w-4 h-4 accent-primary"
              />
              <span>Показывать меню на сайте</span>
            </label>

            {content.menu.categories.map((category, catIndex) => (
              <div key={category.id} className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex gap-3 items-center">
                  <input
                    className="input-field flex-1 font-medium"
                    value={category.name}
                    onChange={(e) =>
                      updateMenuCategory(catIndex, {
                        ...category,
                        name: e.target.value,
                      })
                    }
                  />
                  <button
                    onClick={() => removeCategory(catIndex)}
                    className="text-red-400 text-sm hover:underline"
                  >
                    Удалить
                  </button>
                </div>

                {category.items.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="grid sm:grid-cols-[1fr_1fr_100px_auto] gap-3 items-start pl-4 border-l-2 border-white/10"
                  >
                    <input
                      className="input-field"
                      placeholder="Название"
                      value={item.name}
                      onChange={(e) => {
                        const items = [...category.items];
                        items[itemIndex] = { ...item, name: e.target.value };
                        updateMenuCategory(catIndex, { ...category, items });
                      }}
                    />
                    <input
                      className="input-field"
                      placeholder="Описание"
                      value={item.description ?? ""}
                      onChange={(e) => {
                        const items = [...category.items];
                        items[itemIndex] = {
                          ...item,
                          description: e.target.value,
                        };
                        updateMenuCategory(catIndex, { ...category, items });
                      }}
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Цена"
                      value={item.price}
                      onChange={(e) => {
                        const items = [...category.items];
                        items[itemIndex] = {
                          ...item,
                          price: Number(e.target.value),
                        };
                        updateMenuCategory(catIndex, { ...category, items });
                      }}
                    />
                    <button
                      onClick={() => {
                        const items = category.items.filter(
                          (_, i) => i !== itemIndex,
                        );
                        updateMenuCategory(catIndex, { ...category, items });
                      }}
                      className="text-red-400 text-sm py-3 hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addMenuItem(catIndex)}
                  className="btn-ghost text-sm py-2 px-4"
                >
                  + Позиция
                </button>
              </div>
            ))}

            <button onClick={addCategory} className="btn-primary">
              + Категория
            </button>
          </div>
        )}

        {tab === "social" && (
          <div className="space-y-6">
            <Field label="VK">
              <input
                className="input-field"
                value={content.social.vk}
                onChange={(e) =>
                  update("social", { ...content.social, vk: e.target.value })
                }
                placeholder="https://vk.com/..."
              />
            </Field>
            <Field label="Telegram">
              <input
                className="input-field"
                value={content.social.telegram}
                onChange={(e) =>
                  update("social", {
                    ...content.social,
                    telegram: e.target.value,
                  })
                }
                placeholder="https://t.me/..."
              />
            </Field>
            <Field label="Instagram">
              <input
                className="input-field"
                value={content.social.instagram}
                onChange={(e) =>
                  update("social", {
                    ...content.social,
                    instagram: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Facebook">
              <input
                className="input-field"
                value={content.social.facebook}
                onChange={(e) =>
                  update("social", {
                    ...content.social,
                    facebook: e.target.value,
                  })
                }
              />
            </Field>

            <hr className="border-white/10" />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={content.reviews.enabled}
                onChange={(e) =>
                  update("reviews", {
                    ...content.reviews,
                    enabled: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-primary"
              />
              <span>Показывать ссылки на отзывы</span>
            </label>
            <Field label="Google Maps">
              <input
                className="input-field"
                value={content.reviews.google}
                onChange={(e) =>
                  update("reviews", {
                    ...content.reviews,
                    google: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Яндекс">
              <input
                className="input-field"
                value={content.reviews.yandex}
                onChange={(e) =>
                  update("reviews", {
                    ...content.reviews,
                    yandex: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="2ГИС">
              <input
                className="input-field"
                value={content.reviews.gis2}
                onChange={(e) =>
                  update("reviews", {
                    ...content.reviews,
                    gis2: e.target.value,
                  })
                }
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
