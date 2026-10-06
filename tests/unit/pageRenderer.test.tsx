import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageRenderer } from "@/components/pages/PageRenderer";
import type { PageSection, Product } from "@/types";

/**
 * PageRenderer is the single storefront + admin-preview renderer for the
 * section-based page builder (PLAN-PAGE-BUILDER.md Step D). Every section
 * type must render its content in Cairo Underground style, RTL-aware, with
 * defensive normalization for corrupt sheet data.
 */

// next/link renders an anchor — no App Router context in jsdom.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: Record<string, any>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// next/image passthrough that strips Next-only props (fill, priority, …).
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({
    src,
    alt = "",
    fill: _fill,
    priority: _priority,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    sizes: _sizes,
    loader: _loader,
    unoptimized: _unoptimized,
    ...rest
  }: Record<string, any>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "object" ? src?.src : src} alt={alt} {...rest} />
  ),
}));

// ProductCard links through the next-intl navigation factory, which needs
// router context that does not exist in unit tests.
vi.mock("@/i18n/routing", () => ({
  __esModule: true,
  Link: ({ href, children, ...rest }: Record<string, any>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const PAGE_TITLE = { en: "Test Page", ar: "صفحة اختبار", fr: "Page Test" };

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "riff-tee",
    category_id: "t-shirts",
    name_en: "Riff Tee",
    name_ar: "تيشيرت",
    name_fr: "Tee",
    desc_en: "Heavyweight cotton",
    desc_ar: "قطن",
    desc_fr: "Coton",
    price: 250,
    quantity: 3,
    images: ["/images/placeholders/egyrock-1.jpeg"],
    created_at: "2026-01-01T00:00:00.000Z",
    sizes: [],
    ...overrides,
  };
}

function renderPage(overrides: Partial<React.ComponentProps<typeof PageRenderer>> = {}) {
  return render(<PageRenderer title={PAGE_TITLE} sections={[]} locale="en" {...overrides} />);
}

describe("PageRenderer shell", () => {
  it("shows the localized page title as the H1 with the brand underline", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Test Page" })).toBeTruthy();
  });

  it("picks the AR title for the Arabic locale", () => {
    renderPage({ locale: "ar" });
    expect(screen.getByRole("heading", { level: 1, name: "صفحة اختبار" })).toBeTruthy();
  });

  it("hides the header when show_title is false", () => {
    renderPage({ settings: { width: "wide", background: "default", show_title: false } });
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("sets dir=rtl on the wrapper for Arabic", () => {
    const { container } = renderPage({ locale: "ar" });
    expect(container.firstElementChild?.getAttribute("dir")).toBe("rtl");
  });

  it("sets dir=ltr for English and French", () => {
    const { container: en } = renderPage({ locale: "en" });
    expect(en.firstElementChild?.getAttribute("dir")).toBe("ltr");
    const { container: fr } = renderPage({ locale: "fr" });
    expect(fr.firstElementChild?.getAttribute("dir")).toBe("ltr");
  });

  it("applies width and background settings classes", () => {
    const { container } = renderPage({
      settings: { width: "narrow", background: "sunken", show_title: true },
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain("bg-sunken");
    expect(outer.firstElementChild?.className).toContain("max-w-3xl");
  });

  it("falls back to default settings classes for corrupt settings", () => {
    const { container } = renderPage({
      settings: { width: "huge", background: "neon", show_title: "yes" } as any,
    });
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).not.toContain("bg-sunken");
    expect(outer.firstElementChild?.className).toContain("max-w-6xl");
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
  });

  it("shows the empty placeholder when there are no sections", () => {
    renderPage();
    expect(screen.getByText("No content sections yet.")).toBeTruthy();
  });

  it("drops corrupt sections instead of crashing", () => {
    renderPage({ sections: [{ type: "marquee" }, null, "junk"] as any });
    expect(screen.getByText("No content sections yet.")).toBeTruthy();
  });
});

describe("hero section", () => {
  const hero: PageSection = {
    id: "hero-1",
    type: "hero",
    title: { en: "Loud & Live", ar: "صاخب وحي", fr: "Fort et Live" },
    subtitle: { en: "From Cairo, with distortion", ar: "", fr: "" },
    image_url: "/images/placeholders/egyrock-1.jpeg",
    button_label: { en: "Shop the drop", ar: "", fr: "" },
    button_link: "/en/catalog",
    align: "left",
  };

  it("renders title, subtitle, background image and internal button", () => {
    const { container } = renderPage({ sections: [hero] });

    expect(screen.getByRole("heading", { level: 2, name: "Loud & Live" })).toBeTruthy();
    expect(screen.getByText("From Cairo, with distortion")).toBeTruthy();

    const img = container.querySelector('img[src="/images/placeholders/egyrock-1.jpeg"]');
    expect(img).not.toBeNull();

    const link = screen.getByRole("link", { name: "Shop the drop" });
    expect(link.getAttribute("href")).toBe("/en/catalog");
    expect(link.getAttribute("target")).toBeNull(); // internal link
  });

  it("localizes the hero for Arabic with RTL typography", () => {
    renderPage({ sections: [hero], locale: "ar" });
    expect(screen.getByRole("heading", { level: 2, name: "صاخب وحي" })).toBeTruthy();
  });

  it("renders external button links in a new tab", () => {
    renderPage({
      sections: [{ ...hero, button_link: "https://instagram.com/egyrock" }],
    });
    const link = screen.getByRole("link", { name: "Shop the drop" });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("omits the button when the link is empty", () => {
    renderPage({ sections: [{ ...hero, button_link: "" }] });
    expect(screen.queryByRole("link", { name: "Shop the drop" })).toBeNull();
  });
});

describe("heading section", () => {
  it("renders an H2 by default", () => {
    renderPage({
      sections: [
        {
          id: "h",
          type: "heading",
          text: { en: "Section Two", ar: "", fr: "" },
          level: 2,
          align: "left",
        },
      ],
    });
    expect(screen.getByRole("heading", { level: 2, name: "Section Two" })).toBeTruthy();
  });

  it("renders an H3 when level is 3", () => {
    renderPage({
      sections: [
        {
          id: "h",
          type: "heading",
          text: { en: "Subsection", ar: "", fr: "" },
          level: 3,
          align: "left",
        },
      ],
    });
    expect(screen.getByRole("heading", { level: 3, name: "Subsection" })).toBeTruthy();
  });
});

describe("text section", () => {
  it("renders the body with line breaks preserved", () => {
    renderPage({
      sections: [
        {
          id: "t",
          type: "text",
          body: { en: "Line one\nLine two", ar: "", fr: "" },
          align: "left",
        },
      ],
    });
    expect(screen.getByText(/Line one/)).toBeTruthy();
    expect(screen.getByText(/Line two/)).toBeTruthy();
    const block = screen.getByText(/Line one/);
    expect(block.textContent).toContain("Line one\nLine two");
    expect(block.className).toContain("whitespace-pre-wrap");
  });

  it("renders an em dash for an empty body", () => {
    renderPage({
      sections: [{ id: "t", type: "text", body: { en: "", ar: "", fr: "" }, align: "left" }],
    });
    expect(screen.getByText("—")).toBeTruthy();
  });
});

describe("image section", () => {
  it("renders the image with localized caption", () => {
    const { container } = renderPage({
      sections: [
        {
          id: "i",
          type: "image",
          image_url: "/images/placeholders/egyrock-1.jpeg",
          alt: { en: "Live poster", ar: "", fr: "" },
          caption: { en: "Zamalek, 2025", ar: "", fr: "" },
        },
      ],
    });
    const img = container.querySelector('img[alt="Live poster"]');
    expect(img).not.toBeNull();
    expect(screen.getByText("Zamalek, 2025")).toBeTruthy();
  });

  it("shows the placeholder when no image is set", () => {
    renderPage({
      sections: [
        {
          id: "i",
          type: "image",
          image_url: "",
          alt: { en: "", ar: "", fr: "" },
          caption: { en: "", ar: "", fr: "" },
        },
      ],
    });
    expect(screen.getByText("No image set")).toBeTruthy();
  });
});

describe("gallery section", () => {
  it("renders one image per gallery entry", () => {
    const { container } = renderPage({
      sections: [
        {
          id: "g",
          type: "gallery",
          images: ["/img/one.jpg", "/img/two.jpg"],
          alt: { en: "Gig photos", ar: "", fr: "" },
          columns: 2,
        },
      ],
    });
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute("src")).toBe("/img/one.jpg");
    expect(imgs[0].getAttribute("alt")).toBe("Gig photos");
  });

  it("shows the empty placeholder when there are no images", () => {
    renderPage({
      sections: [
        { id: "g", type: "gallery", images: [], alt: { en: "", ar: "", fr: "" }, columns: 3 },
      ],
    });
    expect(screen.getByText("No gallery images yet")).toBeTruthy();
  });
});

describe("faq section", () => {
  const faq: PageSection = {
    id: "faq-1",
    type: "faq",
    title: { en: "Common questions", ar: "", fr: "" },
    items: [
      {
        id: "q1",
        question: { en: "Do you ship across Egypt?", ar: "", fr: "" },
        answer: { en: "Yes — nationwide via local courier.", ar: "", fr: "" },
      },
      {
        id: "q2",
        question: { en: "How do I pay?", ar: "", fr: "" },
        answer: { en: "InstaPay, then upload your receipt.", ar: "", fr: "" },
      },
    ],
  };

  it("renders the section title and each Q/A as a native details block", () => {
    const { container } = renderPage({ sections: [faq] });

    expect(screen.getByRole("heading", { level: 2, name: "Common questions" })).toBeTruthy();
    expect(screen.getByText("Do you ship across Egypt?")).toBeTruthy();
    expect(screen.getByText("Yes — nationwide via local courier.")).toBeTruthy();
    expect(screen.getByText("How do I pay?")).toBeTruthy();

    const details = container.querySelectorAll("details");
    expect(details).toHaveLength(2);
    expect(container.querySelector("summary")).not.toBeNull();
  });

  it("shows the empty placeholder for an FAQ section with no items", () => {
    renderPage({ sections: [{ ...faq, items: [] }] });
    expect(screen.getByText("No FAQ items yet")).toBeTruthy();
  });
});

describe("products section", () => {
  const productsSection: PageSection = {
    id: "p-1",
    type: "products",
    title: { en: "Fresh merch", ar: "", fr: "" },
    category_id: "",
    limit: 8,
  };

  it("renders the catalog grid through ProductCard", () => {
    renderPage({ sections: [productsSection], products: [makeProduct()] });

    expect(screen.getByRole("heading", { level: 2, name: "Fresh merch" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Riff Tee" })).toBeTruthy();
    expect(screen.getByText("250 EGP")).toBeTruthy();
    expect(screen.getByRole("link", { name: "VIEW ITEM" }).getAttribute("href")).toBe(
      "/catalog/riff-tee",
    );
  });

  it("filters by category and honours the section limit", () => {
    const hoodie = makeProduct({ id: "pit-hoodie", name_en: "Pit Hoodie", category_id: "hoodies" });
    const tee = makeProduct();

    const categoryRender = renderPage({
      sections: [{ ...productsSection, category_id: "hoodies" }],
      products: [hoodie, tee],
    });
    expect(screen.getByRole("heading", { level: 3, name: "Pit Hoodie" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Riff Tee" })).toBeNull();
    categoryRender.unmount();

    renderPage({
      sections: [{ ...productsSection, limit: 1 }],
      products: [tee, hoodie],
    });
    expect(screen.getByRole("heading", { level: 3, name: "Riff Tee" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Pit Hoodie" })).toBeNull();
  });

  it("shows the empty placeholder when the catalog has no matches", () => {
    renderPage({ sections: [productsSection], products: [] });
    expect(screen.getByText("No products to show yet")).toBeTruthy();
  });
});

describe("cta section", () => {
  const cta: PageSection = {
    id: "cta-1",
    type: "cta",
    title: { en: "Join the mailing list", ar: "", fr: "" },
    body: { en: "First dibs on drops and gig tickets.", ar: "", fr: "" },
    button_label: { en: "Sign me up", ar: "", fr: "" },
    button_link: "/en/newsletter",
  };

  it("renders title, body and the stamp button", () => {
    renderPage({ sections: [cta] });
    expect(screen.getByRole("heading", { level: 2, name: "Join the mailing list" })).toBeTruthy();
    expect(screen.getByText("First dibs on drops and gig tickets.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign me up" }).getAttribute("href")).toBe(
      "/en/newsletter",
    );
  });

  it("renders without the button when no label is set", () => {
    renderPage({ sections: [{ ...cta, button_label: { en: "", ar: "", fr: "" } }] });
    expect(screen.queryByRole("link", { name: "Sign me up" })).toBeNull();
  });
});

describe("divider section", () => {
  it("renders the branded stamp divider", () => {
    renderPage({ sections: [{ id: "d", type: "divider", style: "stamp" }] });
    expect(screen.getByText("✦ EGYROCK ✦")).toBeTruthy();
  });

  it("renders a plain rule for the line style", () => {
    const { container } = renderPage({ sections: [{ id: "d", type: "divider", style: "line" }] });
    expect(container.querySelector("hr")).not.toBeNull();
  });
});

describe("full page smoke test", () => {
  it("renders all nine section types together without crashing", () => {
    const sections: PageSection[] = [
      {
        id: "hero-1",
        type: "hero",
        title: { en: "Loud & Live", ar: "", fr: "" },
        subtitle: { en: "", ar: "", fr: "" },
        image_url: "",
        button_label: { en: "", ar: "", fr: "" },
        button_link: "",
        align: "left",
      },
      {
        id: "head-1",
        type: "heading",
        text: { en: "Lineup", ar: "", fr: "" },
        level: 2,
        align: "left",
      },
      { id: "text-1", type: "text", body: { en: "Body copy", ar: "", fr: "" }, align: "left" },
      {
        id: "img-1",
        type: "image",
        image_url: "/img/x.jpg",
        alt: { en: "Poster", ar: "", fr: "" },
        caption: { en: "", ar: "", fr: "" },
      },
      {
        id: "gal-1",
        type: "gallery",
        images: ["/img/1.jpg"],
        alt: { en: "", ar: "", fr: "" },
        columns: 3,
      },
      { id: "faq-1", type: "faq", title: { en: "FAQ", ar: "", fr: "" }, items: [] },
      {
        id: "prod-1",
        type: "products",
        title: { en: "Merch", ar: "", fr: "" },
        category_id: "",
        limit: 8,
      },
      {
        id: "cta-1",
        type: "cta",
        title: { en: "CTA", ar: "", fr: "" },
        body: { en: "", ar: "", fr: "" },
        button_label: { en: "", ar: "", fr: "" },
        button_link: "",
      },
      { id: "div-1", type: "divider", style: "stamp" },
    ];

    renderPage({ sections, products: [makeProduct()] });

    expect(screen.getByRole("heading", { level: 1, name: "Test Page" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Lineup" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Riff Tee" })).toBeTruthy();
    expect(screen.getByText("✦ EGYROCK ✦")).toBeTruthy();
  });
});
