import type { SiteContent } from "@/lib/types";

interface MenuProps {
  content: SiteContent;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
}

export function Menu({ content }: MenuProps) {
  if (!content.menu.enabled || content.menu.categories.length === 0) {
    return null;
  }

  return (
    <section id="menu" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold mb-3">Меню</h2>
          <p className="text-muted">Выберите то, что по душе</p>
        </div>

        <div className="space-y-12">
          {content.menu.categories.map((category) => (
            <div key={category.id}>
              <h3
                className="font-display text-xl font-semibold mb-6 pb-2 border-b"
                style={{ borderColor: `${content.theme.primaryColor}40` }}
              >
                {category.name}
              </h3>
              <ul className="space-y-4">
                {category.items.map((item) => (
                  <li
                    key={item.id}
                    className="glass-card rounded-xl p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-lg">{item.name}</p>
                      {item.description && (
                        <p className="text-muted text-sm mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <p
                      className="font-semibold text-lg shrink-0"
                      style={{ color: content.theme.primaryColor }}
                    >
                      {formatPrice(item.price)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
