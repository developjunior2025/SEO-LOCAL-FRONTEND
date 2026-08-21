/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Filter,
  History,
  Inbox,
  MessageCircle,
  MessageSquareReply,
  Megaphone,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  WandSparkles,
  X,
} from "lucide-react";
import { utilidadesV15Api, type Row } from "@/services/utilidadesApi";
import "./utilidades-reputation-v26.css";

const VERSION = "V26.1.2";

type Props = {
  locationId: number;
  locationName: string;
  onAction: (title: string, description: string) => void;
};

type TabKey =
  | "summary"
  | "inbox"
  | "responses"
  | "campaigns"
  | "feedback"
  | "sources"
  | "topics"
  | "competition"
  | "showcase"
  | "automation"
  | "history";

const TABS: Array<[TabKey, string]> = [
  ["summary", "Resumen"],
  ["inbox", "Inbox"],
  ["responses", "Respuestas"],
  ["campaigns", "Campañas"],
  ["feedback", "Feedback"],
  ["sources", "Fuentes"],
  ["topics", "Temas"],
  ["competition", "Competencia"],
  ["showcase", "Showcase"],
  ["automation", "Automatización"],
  ["history", "Historial"],
];

function rec(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Row)
    : {};
}
function rows(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}
function n(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function s(value: unknown, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}
function pct(value: unknown) {
  return `${Math.round(n(value))}%`;
}
function dateLabel(value: unknown) {
  const raw = s(value, "");
  if (!raw) return "—";
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3]),
      )
    : new Date(raw);
  return Number.isNaN(date.getTime())
    ? raw
    : new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}
function ratingStars(value: unknown) {
  return `${n(value).toFixed(1)} ★`;
}
function npsLabel(value: unknown) {
  const code = s(value, "").toLowerCase();
  if (code === "promoter") return "Promotor";
  if (code === "passive") return "Pasivo";
  if (code === "detractor") return "Detractor";
  return s(value);
}
function toneLabel(value: unknown) {
  const code = s(value, "").toLowerCase();
  if (code === "critical") return "Crítica";
  if (code === "high") return "Alta";
  if (code === "medium") return "Media";
  if (code === "positive") return "Positivo";
  if (code === "negative") return "Negativo";
  if (code === "neutral") return "Neutral";
  if (code === "opportunity") return "Oportunidad";
  if (code === "risk") return "Riesgo";
  if (code === "stable") return "Estable";
  return s(value);
}

export default function UtilidadesReputationManagerV26({
  locationId,
  onAction,
}: Props) {
  const navigate = useNavigate();
  const [state, setState] = useState<Row>({});
  const [tab, setTab] = useState<TabKey>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Row | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseTone, setResponseTone] = useState("professional");
  const [responseGenerating, setResponseGenerating] = useState(false);
  const [campaignModal, setCampaignModal] = useState(false);
  const [campaign, setCampaign] = useState<Row>({
    name: "Post-visita odontología",
    channel: "sms",
    trigger: "Servicio completado",
    delayHours: 2,
    followUpHours: 48,
    audience: 143,
  });
  const [search, setSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState("all");
  const [historyRange, setHistoryRange] = useState(180);

  async function load() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.reputationManager(locationId);
      setState(result);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cargar Reputation Manager V26.1.2.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [locationId]);

  const canonical = rec(state.canonical);
  const health = rec(state.health);
  const inbox = rec(state.inbox);
  const allReviews = rows(inbox.reviews);
  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allReviews.filter((review) => {
      const source = s(review.source, "").toLowerCase();
      const rating = n(review.rating);
      const responded = review.responded;
      const matchesFilter =
        inboxFilter === "all" ||
        (inboxFilter === "unanswered" && !responded) ||
        (inboxFilter === "negative" && rating <= 2) ||
        (inboxFilter === "three" && rating === 3) ||
        (inboxFilter === "positive" && rating >= 4) ||
        inboxFilter.toLowerCase() === source;
      const haystack =
        `${s(review.author, "")} ${s(review.body, "")} ${s(review.theme, "")} ${source}`.toLowerCase();
      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [allReviews, search, inboxFilter]);

  async function run() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.reputationManagerRun(
        locationId,
        historyRange,
      );
      setState(result);
      setSuccess(
        "Reputation Manager V26.1.2 actualizado y guardado en PostgreSQL.",
      );
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar Reputation Manager.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function suggestForReview(review: Row, tone: string) {
    setResponseGenerating(true);
    try {
      const result = await utilidadesV15Api.reputationResponseSuggestion(
        locationId,
        s(review.id),
        tone,
      );
      setResponseTone(tone);
      setResponseText(s(result.suggestion, ""));
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo generar la sugerencia.",
      );
    } finally {
      setResponseGenerating(false);
    }
  }

  async function suggest(tone: string) {
    if (!selectedReview) return;
    await suggestForReview(selectedReview, tone);
  }

  function openResponse(review: Row) {
    setSelectedReview(review);
    const existing = s(review.responseText, "");
    if (existing) {
      setResponseTone(s(review.responseTone, "professional"));
      setResponseText(existing);
      return;
    }
    setResponseTone("professional");
    setResponseText("");
    void suggestForReview(review, "professional");
  }

  async function saveResponse(publish: boolean) {
    if (!selectedReview || !responseText.trim()) return;
    setLoading(true);
    try {
      const result = await utilidadesV15Api.reputationRespond(
        locationId,
        s(selectedReview.id),
        { response: responseText.trim(), tone: responseTone, publish },
      );
      setState(result);
      setSelectedReview(null);
      setResponseText("");
      setSuccess(
        publish
          ? "Respuesta aprobada. La publicación externa sólo ocurre con conector compatible."
          : "Borrador de respuesta aprobado y trazado.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la respuesta.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    setLoading(true);
    try {
      const result = await utilidadesV15Api.reputationCreateCampaign(
        locationId,
        campaign,
      );
      setState(rec(result.state));
      setCampaignModal(false);
      setSuccess(
        "Campaña creada en PostgreSQL. Queda en borrador hasta activarla.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo crear la campaña.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function campaignStatus(id: number, status: string) {
    setLoading(true);
    try {
      setState(
        await utilidadesV15Api.reputationCampaignStatus(locationId, id, status),
      );
      setSuccess(`Campaña actualizada: ${status}.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar la campaña.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function feedbackStatus(feedbackId: string, status: string) {
    setLoading(true);
    try {
      setState(
        await utilidadesV15Api.reputationFeedback(locationId, {
          feedbackId,
          status,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar el feedback.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveShowcase(config: Row) {
    setLoading(true);
    try {
      setState(await utilidadesV15Api.reputationShowcase(locationId, config));
      setSuccess("Showcase actualizado con política de consentimiento.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar Showcase.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(ruleId: string, enabled: boolean) {
    setLoading(true);
    try {
      setState(
        await utilidadesV15Api.reputationAutomation(locationId, {
          ruleId,
          enabled,
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo actualizar la regla.",
      );
    } finally {
      setLoading(false);
    }
  }

  const kpis = [
    [
      "Reputation Health",
      `${n(health.score)}/100`,
      <ShieldCheck size={17} />,
      "Score ponderado y explicable",
    ],
    [
      "Rating",
      ratingStars(canonical.rating),
      <Star size={17} />,
      "Promedio canónico",
    ],
    [
      "Reseñas",
      s(canonical.totalReviews),
      <MessageCircle size={17} />,
      `${s(canonical.googleReviews)} Google + otras fuentes`,
    ],
    [
      "Nuevas 30d",
      s(canonical.newReviews30),
      <TrendingUp size={17} />,
      "Velocidad reciente",
    ],
    [
      "Respondidas",
      pct(canonical.responseRate),
      <MessageSquareReply size={17} />,
      "Cobertura de respuesta",
    ],
    [
      "Response SLA",
      `${s(canonical.averageResponseHours)} h`,
      <Clock3 size={17} />,
      "Tiempo medio",
    ],
    [
      "Sentimiento",
      pct(canonical.positiveSentiment),
      <Sparkles size={17} />,
      "Positivo",
    ],
    [
      "Incidencias",
      s(health.incidences),
      <AlertTriangle size={17} />,
      "Requieren revisión",
    ],
  ] as const;

  return (
    <section className="rep-v26">
      <header className="rep-v26-hero">
        <div>
          <div className="rep-v26-badges">
            <b>LOCAL LAB {VERSION}</b>
            <span>Persistencia activa</span>
            <span>Canonical Review Store</span>
          </div>
          <h2>Reputation Manager</h2>
          <p>
            Monitorización, respuesta, generación, feedback, inteligencia y
            prueba social en un solo centro operativo.
          </p>
          <small>
            Fuente: {s(state.source)} · {dateLabel(state.generatedAt)}
          </small>
        </div>
        <div className="rep-v26-hero-actions">
          <button onClick={() => setTab("automation")}>
            <Settings2 size={15} /> Automatización
          </button>
          <button onClick={() => setTab("campaigns")}>
            <Megaphone size={15} /> Campañas
          </button>
          <button onClick={() => setTab("history")}>
            <History size={15} /> Historial
          </button>
          <button className="primary" onClick={() => void run()}>
            <RefreshCw size={15} /> Actualizar reputación
          </button>
        </div>
      </header>

      {error ? (
        <div className="rep-v26-message error">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      ) : null}
      {success ? (
        <div className="rep-v26-message success">
          <CheckCircle2 size={16} />
          {success}
          <button onClick={() => setSuccess(null)}>
            <X size={14} />
          </button>
        </div>
      ) : null}
      <div className="rep-v26-kpis">
        {kpis.map(([label, value, icon, hint]) => (
          <article key={label}>
            <div>
              <span>
                {icon}
                {label}
              </span>
              <strong>{value}</strong>
              <small>{hint}</small>
            </div>
          </article>
        ))}
      </div>

      <div className="rep-v26-shell">
        <nav className="rep-v26-tabs">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        {tab === "summary" ? (
          <Summary
            state={state}
            onTab={setTab}
            onAction={onAction}
            onNavigate={navigate}
          />
        ) : null}
        {tab === "inbox" ? (
          <InboxView
            reviews={filteredReviews}
            total={allReviews.length}
            globalTotal={n(canonical.totalReviews)}
            globalResponseRate={n(canonical.responseRate)}
            search={search}
            setSearch={setSearch}
            filter={inboxFilter}
            setFilter={setInboxFilter}
            onRespond={openResponse}
          />
        ) : null}
        {tab === "responses" ? (
          <ResponsesView state={state} onRespond={openResponse} />
        ) : null}
        {tab === "campaigns" ? (
          <CampaignsView
            campaigns={rows(state.campaigns)}
            onCreate={() => setCampaignModal(true)}
            onStatus={(id, status) => void campaignStatus(id, status)}
          />
        ) : null}
        {tab === "feedback" ? (
          <FeedbackView
            data={rec(state.feedback)}
            onStatus={(id, status) => void feedbackStatus(id, status)}
          />
        ) : null}
        {tab === "sources" ? (
          <SourcesView sources={rows(state.sources)} canonical={canonical} />
        ) : null}
        {tab === "topics" ? (
          <TopicsView topics={rows(state.topics)} reviews={allReviews} />
        ) : null}
        {tab === "competition" ? (
          <CompetitionView
            data={rec(state.competition)}
            onNavigate={navigate}
          />
        ) : null}
        {tab === "showcase" ? (
          <ShowcaseView
            data={rec(state.showcase)}
            onSave={(config) => void saveShowcase(config)}
          />
        ) : null}
        {tab === "automation" ? (
          <AutomationView
            rules={rows(state.automation)}
            onToggle={(id, enabled) => void toggleRule(id, enabled)}
          />
        ) : null}
        {tab === "history" ? (
          <HistoryView
            history={rows(state.history)}
            range={historyRange}
            setRange={setHistoryRange}
          />
        ) : null}
      </div>

      {loading ? (
        <div className="rep-v26-loading">
          <RefreshCw className="spin" size={22} />
          <span>Procesando Reputation Manager V26.1.2…</span>
        </div>
      ) : null}
      {selectedReview ? (
        <ResponseModal
          review={selectedReview}
          text={responseText}
          setText={setResponseText}
          tone={responseTone}
          generating={responseGenerating}
          canPublishExternally={
            rec(state.publicationCapabilities)[s(selectedReview.source)] ===
            true
          }
          onSuggest={(v) => void suggest(v)}
          onSave={(publish) => void saveResponse(publish)}
          onClose={() => setSelectedReview(null)}
        />
      ) : null}
      {campaignModal ? (
        <CampaignModal
          value={campaign}
          setValue={setCampaign}
          onSave={() => void createCampaign()}
          onClose={() => setCampaignModal(false)}
        />
      ) : null}
    </section>
  );
}

function Summary({
  state,
  onTab,
  onAction,
  onNavigate,
}: {
  state: Row;
  onTab: (tab: TabKey) => void;
  onAction: Props["onAction"];
  onNavigate: (path: string) => void;
}) {
  const health = rec(state.health);
  const canonical = rec(state.canonical);
  const insights = rows(state.insights);
  const integrity = rec(state.integrity);
  const dimensions = rows(rec(state.methodology).dimensions);
  const integrations = rec(state.integrations);
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-summary-top">
        <article className="rep-v26-health">
          <div
            className="ring"
            style={
              {
                "--score": `${n(health.score) * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{s(health.score)}</strong>
              <span>/100</span>
            </div>
          </div>
          <div>
            <small>REPUTATION HEALTH</small>
            <h3>
              {n(health.score) >= 85
                ? "Rendimiento sólido"
                : n(health.score) >= 70
                  ? "Base saludable con oportunidades"
                  : "Requiere intervención prioritaria"}
            </h3>
            <p>
              Rating, volumen, velocity, freshness, respuesta, SLA, sentimiento
              y competencia.
            </p>
          </div>
        </article>
        <article className="rep-v26-attention">
          <small>ATENCIÓN OPERATIVA</small>
          <h3>
            {s(rec(state.inbox).sampleUnanswered)} sin responder en muestra
            operativa de {s(rec(state.inbox).totalVisible)} ·{" "}
            {s(rec(state.inbox).sampleCritical)} críticas
          </h3>
          <p>
            Universo canónico: {s(rec(state.inbox).globalTotal)} reviews ·{" "}
            {pct(rec(state.inbox).globalResponseRate)} respondidas · ≈
            {s(rec(state.inbox).globalUnansweredApprox)} pendientes estimadas ·{" "}
            {s(canonical.averageResponseHours)} h SLA global
          </p>
          <button onClick={() => onTab("inbox")}>
            Abrir Inbox <Inbox size={14} />
          </button>
        </article>
      </div>
      <div className="rep-v26-mini-strip">
        <span>
          <CheckCircle2 />
          Canonical: {s(canonical.totalReviews)} reviews
        </span>
        <span>
          <AlertTriangle />
          {s(health.incidences)} incidencias
        </span>
        <span>
          <TrendingUp />
          {s(canonical.newReviews30)} nuevas 30d
        </span>
        <span>
          <Star />
          {ratingStars(canonical.rating)}
        </span>
        <span>
          <ShieldCheck />
          {Object.values(integrity).filter(Boolean).length}/
          {Object.keys(integrity).length} controles de integridad
        </span>
      </div>
      <section className="rep-v26-section">
        <div className="rep-v26-section-title">
          <div>
            <small>INTELIGENCIA DE REPUTACIÓN</small>
            <h3>Qué requiere atención y qué convertir en ventaja</h3>
          </div>
        </div>
        <div className="rep-v26-insights">
          {insights.map((item) => (
            <article key={s(item.id)} className={`sev-${s(item.severity)}`}>
              <small>{toneLabel(item.severity)}</small>
              <h4>{s(item.title)}</h4>
              <p>{s(item.description)}</p>
              <div>
                <button
                  className="primary"
                  onClick={() => onAction(s(item.title), s(item.description))}
                >
                  Crear acción
                </button>
                <button
                  onClick={() => onTab(s(item.route, "summary") as TabKey)}
                >
                  Abrir módulo
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="rep-v26-section">
        <div className="rep-v26-section-title">
          <div>
            <small>METODOLOGÍA</small>
            <h3>Reputation Health explicable</h3>
          </div>
        </div>
        <div className="rep-v26-methodology-meta">
          <span>Pesos: {s(health.weightTotal)}%</span>
          <span>
            Suma ponderada: {s(health.rawScore)} → {s(health.score)}/100
          </span>
        </div>
        <div className="rep-v26-dimensions">
          {dimensions.map((item) => (
            <div key={s(item.key)}>
              <span>{s(item.label)}</span>
              <b>{s(item.score)}/100</b>
              <small>
                Peso {Math.round(n(item.weight) * 100)}% · aporta{" "}
                {s(item.contribution)} pts
              </small>
              <i>
                <em style={{ width: `${n(item.score)}%` }} />
              </i>
            </div>
          ))}
        </div>
      </section>
      <section className="rep-v26-advantage">
        <small>VENTAJA SEOLOCAL</small>
        <h3>Reputación conectada al expediente</h3>
        <p>
          Auditoría GBP detecta; Reputation Manager opera; Rank Tracker y Search
          Grid permiten observar correlaciones sin afirmar causalidad
          automática.
        </p>
        <div>
          {[
            ["Auditoría GBP", "gbpAudit"],
            ["Rank Tracker", "rankTracker"],
            ["Search Grid", "searchGrid"],
            ["Publicaciones GBP", "gbpPosts"],
          ].map(([label, key]) => (
            <button key={key} onClick={() => onNavigate(s(integrations[key]))}>
              {label}
              <CheckCircle2 size={13} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function InboxView({
  reviews,
  total,
  globalTotal,
  globalResponseRate,
  search,
  setSearch,
  filter,
  setFilter,
  onRespond,
}: {
  reviews: Row[];
  total: number;
  globalTotal: number;
  globalResponseRate: number;
  search: string;
  setSearch: (v: string) => void;
  filter: string;
  setFilter: (v: string) => void;
  onRespond: (r: Row) => void;
}) {
  const filters = [
    ["all", "Todas"],
    ["unanswered", "Sin responder"],
    ["negative", "1–2★"],
    ["three", "3★"],
    ["positive", "4–5★"],
    ["Google", "Google"],
    ["Facebook", "Facebook"],
    ["Directo", "Directo"],
  ];
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>REVIEW INBOX</small>
          <h3>Inbox unificado y priorizado</h3>
          <p>
            Busca, filtra y responde sin perder la fuente, el SLA ni el riesgo.
          </p>
        </div>
      </div>
      <div className="rep-v26-toolbar">
        <label>
          <Search size={15} />
          <input
            placeholder="Buscar autor, tema o texto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filters">
          <Filter size={14} />
          {filters.map(([key, label]) => (
            <button
              className={filter === key ? "active" : ""}
              key={key}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="rep-v26-inbox-count">
        <b>Muestra operativa:</b> mostrando {reviews.length} de {total} reviews
        con texto disponible · <b>Universo canónico:</b> {globalTotal} reviews ·{" "}
        {pct(globalResponseRate)} respondidas.
      </div>
      <div className="rep-v26-review-list">
        {reviews.map((review) => (
          <article
            key={s(review.id)}
            className={`priority-${s(review.priority)}`}
          >
            <div className="review-head">
              <div>
                <b>{s(review.author)}</b>
                <span>
                  {s(review.source)} · {dateLabel(review.createdAt)}
                </span>
              </div>
              <div className="review-rating">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < n(review.rating) ? "currentColor" : "none"}
                  />
                ))}
              </div>
            </div>
            <p>{s(review.body)}</p>
            <div className="review-meta">
              <span className={`sent-${s(review.sentiment)}`}>
                {toneLabel(review.sentiment)}
              </span>
              <span>{s(review.theme)}</span>
              <span>Riesgo {s(review.riskScore)}/100</span>
              <span>SLA {s(review.slaHours)} h</span>
              <span>
                {review.responded
                  ? "Respondida"
                  : `${s(review.ageHours)} h sin responder`}
              </span>
            </div>
            <footer>
              <div>
                {review.responded ? (
                  <span className="answered">
                    <CheckCircle2 size={13} />
                    Respondida
                  </span>
                ) : (
                  <span className="pending">
                    <Clock3 size={13} />
                    Pendiente
                  </span>
                )}
              </div>
              <button className="primary" onClick={() => onRespond(review)}>
                {review.responded ? "Revisar respuesta" : "Responder"}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function ResponsesView({
  state,
  onRespond,
}: {
  state: Row;
  onRespond: (r: Row) => void;
}) {
  const reviews = rows(rec(state.inbox).reviews);
  const canonicalQueue = rows(state.responseQueue);
  const pending = canonicalQueue.length
    ? canonicalQueue
    : reviews
        .filter((review) => !review.responded)
        .sort((a, b) => {
          const priorityWeight: Record<string, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          const priorityDelta =
            (priorityWeight[s(b.priority, "low")] ?? 0) -
            (priorityWeight[s(a.priority, "low")] ?? 0);
          if (priorityDelta !== 0) return priorityDelta;
          const riskDelta = n(b.riskScore) - n(a.riskScore);
          if (riskDelta !== 0) return riskDelta;
          return n(b.ageHours) - n(a.ageHours);
        });
  const trace = rows(state.responseTrace);
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>RESPONSE CENTER</small>
          <h3>Generar → Editar → Aprobar → Publicar cuando exista conector</h3>
          <p>
            La asistencia nunca sustituye la aprobación humana. La publicación
            externa requiere un conector compatible.
          </p>
        </div>
      </div>
      <div className="rep-v26-response-grid">
        <section>
          <h4>Cola de respuesta · {pending.length} pendientes</h4>
          <p className="response-queue-guidance">
            Ordenada por prioridad, riesgo y antigüedad. Selecciona una reseña
            para generar, editar y aprobar su respuesta.
          </p>
          {pending.length ? (
            pending.map((review) => (
              <button
                className="response-queue"
                key={s(review.id)}
                onClick={() => onRespond(review)}
              >
                <span>
                  <b>{s(review.author)}</b>
                  <small>
                    {s(review.source)} · {s(review.theme)} ·{" "}
                    {toneLabel(review.priority)} · Riesgo {s(review.riskScore)}
                    /100 · {s(review.ageHours)} h
                  </small>
                </span>
                <strong>{s(review.rating)}★</strong>
              </button>
            ))
          ) : (
            <p className="muted">No hay reseñas pendientes de respuesta.</p>
          )}
        </section>
        <section>
          <h4>Trazabilidad reciente</h4>
          {trace.length ? (
            trace.slice(0, 8).map((item) => (
              <div className="trace" key={`${s(item.reviewId)}-${s(item.at)}`}>
                <UserCheck size={15} />
                <div>
                  <b>{s(item.actor)}</b>
                  <span>
                    {s(item.action)} · {dateLabel(item.at)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              Las aprobaciones y publicaciones aparecerán aquí.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function CampaignsView({
  campaigns,
  onCreate,
  onStatus,
}: {
  campaigns: Row[];
  onCreate: () => void;
  onStatus: (id: number, status: string) => void;
}) {
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>REVIEW GENERATION</small>
          <h3>Campañas de generación y seguimiento</h3>
          <p>
            Email, SMS, QR, enlace y kiosk con funnel atribuible. Local Lab no
            afirma envíos externos.
          </p>
        </div>
        <button className="primary" onClick={onCreate}>
          <Plus size={14} />
          Nueva campaña
        </button>
      </div>
      <div className="rep-v26-campaigns">
        {campaigns.map((c) => (
          <article key={s(c.id)}>
            <header>
              <div>
                <span className={`status-${s(c.status)}`}>{s(c.status)}</span>
                <h4>{s(c.name)}</h4>
                <p>
                  {s(c.channel).toUpperCase()} · {s(c.mode)}
                </p>
              </div>
              <Megaphone size={20} />
            </header>
            <div className="funnel">
              {[
                ["Audiencia", "audience"],
                ["Enviados", "sent"],
                ["Aperturas", "opened"],
                ["Feedback", "feedback"],
                ["Click review", "clicks"],
                ["Reviews tras clic", "reviewsAfterClick"],
              ].map(([label, key]) => (
                <div key={key}>
                  <span>{label}</span>
                  <b>{s(c[key])}</b>
                </div>
              ))}
            </div>
            <div className="rep-v26-attribution">
              <span>
                <b>{s(c.attributedReviews)}</b> reviews atribuidas totales
              </span>
              <span>
                <b>{s(c.reviewsAfterClick)}</b> con clic trazado
              </span>
              <span>
                <b>{s(c.untrackedAttributed)}</b> atribuidas sin clic trazado
              </span>
              <small>{s(c.attributionNote)}</small>
            </div>
            <footer>
              <strong>Conversión atribuida {s(c.conversion)}%</strong>
              {n(c.id) > 0 ? (
                <div>
                  {s(c.status) !== "active" ? (
                    <button
                      className="primary"
                      onClick={() => onStatus(n(c.id), "active")}
                    >
                      <Play size={13} />
                      Activar
                    </button>
                  ) : (
                    <button onClick={() => onStatus(n(c.id), "paused")}>
                      Pausar
                    </button>
                  )}
                  <button onClick={() => onStatus(n(c.id), "completed")}>
                    Finalizar
                  </button>
                </div>
              ) : (
                <small>Crea una campaña para persistir este ejemplo.</small>
              )}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function FeedbackView({
  data,
  onStatus,
}: {
  data: Row;
  onStatus: (id: string, status: string) => void;
}) {
  const items = rows(data.items);
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>FEEDBACK / NPS</small>
          <h3>Feedback privado separado de la reseña pública</h3>
          <p>{s(data.note)}</p>
        </div>
      </div>
      <div className="rep-v26-stat6">
        {[
          ["NPS", data.nps],
          ["Promotores", data.promoters],
          ["Pasivos", data.passives],
          ["Detractores", data.detractors],
          ["Respuestas NPS", data.surveyResponses],
          ["Comentarios", data.receivedComments],
        ].map(([l, v]) => (
          <div key={String(l)}>
            <span>{String(l)}</span>
            <strong>{s(v)}</strong>
          </div>
        ))}
      </div>
      <div className="rep-v26-feedback-standard">{s(data.classification)}</div>
      <div className="rep-v26-feedback-list">
        {items.map((item) => (
          <article key={s(item.id)}>
            <div className={`nps-${s(item.npsGroup)}`}>
              <b>{s(item.score)}</b>
              <span>{npsLabel(item.npsGroup)}</span>
            </div>
            <div>
              <h4>
                {s(item.customer)} · {s(item.topic)}
              </h4>
              <p>{s(item.message)}</p>
              <small>
                {dateLabel(item.receivedAt)} · {s(item.status)}
              </small>
            </div>
            <div>
              {s(item.status) !== "resolved" ? (
                <button
                  className="primary"
                  onClick={() =>
                    onStatus(
                      s(item.id),
                      s(item.status) === "open" ? "contacted" : "resolved",
                    )
                  }
                >
                  {s(item.status) === "open" ? "Marcar contactado" : "Resolver"}
                </button>
              ) : (
                <CheckCircle2 size={18} />
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SourcesView({
  sources,
  canonical,
}: {
  sources: Row[];
  canonical: Row;
}) {
  const sum = sources.reduce((t, r) => t + n(r.reviews), 0);
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>FUENTES DE REPUTACIÓN</small>
          <h3>Fuente, cobertura y deduplicación</h3>
          <p>
            El Canonical Review Store conserva el origen y evita contar dos
            veces la misma review.
          </p>
        </div>
        <div className="source-sum">
          <b>{sum}</b>
          <span>= total canónico {s(canonical.totalReviews)}</span>
        </div>
      </div>
      <div className="rep-v26-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fuente</th>
              <th>Modo</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>+30d</th>
              <th>Respondidas</th>
              <th>SLA</th>
              <th>Share</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((row) => (
              <tr key={s(row.source)}>
                <td>
                  <b>{s(row.source)}</b>
                </td>
                <td>{s(row.mode)}</td>
                <td>{ratingStars(row.rating)}</td>
                <td>{s(row.reviews)}</td>
                <td>+{s(row.new30)}</td>
                <td>{pct(row.responseRate)}</td>
                <td>{s(row.averageResponseHours)} h</td>
                <td>{s(row.share)}%</td>
                <td>
                  <span className={`source-${s(row.status)}`}>
                    {s(row.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rep-v26-tip">
        <ShieldCheck />
        <div>
          <b>Integridad de fuentes</b>
          <span>
            {sum === n(canonical.totalReviews)
              ? `La suma de fuentes coincide con el total canónico. Cobertura global ponderada ${pct(canonical.responseRate)} · SLA global ponderado ${s(canonical.averageResponseHours)} h. Google conserva ${pct(canonical.googleResponseRate)} · ${s(canonical.googleAverageResponseHours)} h para comparaciones GBP.`
              : "Revisar reconciliación de fuentes."}
          </span>
        </div>
      </div>
    </div>
  );
}

function TopicsView({ topics, reviews }: { topics: Row[]; reviews: Row[] }) {
  const [selected, setSelected] = useState<Row | null>(null);
  const examples = selected
    ? reviews.filter(
        (r) =>
          rows(selected.sampleReviewIds).map(String).includes(s(r.id)) ||
          (Array.isArray(selected.sampleReviewIds) &&
            (selected.sampleReviewIds as unknown[])
              .map(String)
              .includes(s(r.id))),
      )
    : [];
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>TOPICS & SENTIMENT</small>
          <h3>Temas, tendencia y evidencia</h3>
          <p>
            El sentimiento se conecta a reviews concretas para evitar
            porcentajes sin trazabilidad. El +/- mide volumen de menciones en
            30 días, no sentimiento.
          </p>
        </div>
      </div>
      <div className="rep-v26-topics">
        {topics.map((topic) => (
          <button
            key={s(topic.theme)}
            className={selected === topic ? "active" : ""}
            onClick={() => setSelected(topic)}
          >
            <div>
              <b>{s(topic.theme)}</b>
              <span>
                {s(topic.mentions)} menciones · rating {s(topic.rating)}★
              </span>
            </div>
            <div>
              <span className="mention-volume-change">
                Menciones 30d: {n(topic.change30) >= 0 ? "+" : ""}
                {s(topic.change30)}%
              </span>
              <small>
                {pct(topic.negativePct)} negativas · {toneLabel(topic.trend)}
              </small>
            </div>
            <i>
              <em style={{ width: `${n(topic.positivePct)}%` }} />
            </i>
          </button>
        ))}
      </div>
      {selected ? (
        <div className="rep-v26-evidence">
          <h4>Evidencia · {s(selected.theme)}</h4>
          {examples.length ? (
            examples.map((review) => (
              <blockquote key={s(review.id)}>
                “{s(review.body)}”{" "}
                <span>
                  {s(review.author)} · {s(review.rating)}★
                </span>
              </blockquote>
            ))
          ) : (
            <p>
              La muestra visible no contiene todas las menciones agregadas del
              periodo.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CompetitionView({
  data,
  onNavigate,
}: {
  data: Row;
  onNavigate: (path: string) => void;
}) {
  const business = rec(data.business);
  const top5 = rec(data.top5);
  const gaps = rows(data.gaps);
  const integrations = rec(data.integrations);
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>REPUTATION BENCHMARK</small>
          <h3>Tu negocio vs. Top 5 local</h3>
          <p>
            <b>Benchmark {s(data.primaryScope, "Google/GBP")}.</b>{" "}
            {s(
              data.scopeNote,
              "Volumen, velocidad 30d, response rate y SLA usan señales Google/GBP; rating y sentimiento conservan la señal canónica multifuente.",
            )}{" "}
            No se afirma causalidad directa sobre ranking.
          </p>
        </div>
        <div className="gap-score">
          <b>{s(data.score)}/100</b>
          <span>Reputation Gap</span>
        </div>
      </div>
      <div className="rep-v26-compare-head">
        <article>
          <small>TU NEGOCIO</small>
          <h4>{s(business.name)}</h4>
          <b>{ratingStars(business.rating)}</b>
          <span>{s(business.reviews)} reviews Google</span>
        </article>
        <article>
          <small>PROMEDIO TOP 5</small>
          <h4>Benchmark local</h4>
          <b>{ratingStars(top5.rating)}</b>
          <span>{s(top5.reviews)} reviews</span>
        </article>
      </div>
      <div className="rep-v26-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Señal</th>
              <th>Tu negocio</th>
              <th>Top 5</th>
              <th>Lectura</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((row) => (
              <tr key={s(row.metric)}>
                <td>
                  <b>{s(row.metric)}</b>
                </td>
                <td>
                  {s(row.business)}
                  {s(row.unit, "")}
                </td>
                <td>
                  {s(row.top5)}
                  {s(row.unit, "")}
                </td>
                <td>
                  <span className={`gap-${s(row.status)}`}>
                    {s(row.status) === "advantage" ? "Ventaja" : "Brecha"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rep-v26-integrations">
        <button onClick={() => onNavigate(s(integrations.gbpAudit))}>
          Auditoría GBP
        </button>
        <button onClick={() => onNavigate(s(integrations.rankTracker))}>
          Rank Tracker
        </button>
        <button onClick={() => onNavigate(s(integrations.searchGrid))}>
          Search Grid
        </button>
      </div>
    </div>
  );
}

function ShowcaseView({
  data,
  onSave,
}: {
  data: Row;
  onSave: (config: Row) => void;
}) {
  const [layout, setLayout] = useState(s(data.layout, "carousel"));
  const [minRating, setMinRating] = useState(n(data.minRating, 5));
  const [consent, setConsent] = useState(data.consentRequired === true);
  const [copied, setCopied] = useState(false);
  const previewCandidates = rows(data.previewCandidates);
  const blockedCandidates = rows(data.blockedCandidates);
  const savedMinRating = n(data.minRating, 5);
  const savedConsent = data.consentRequired === true;
  const policyDirty =
    minRating !== savedMinRating || consent !== savedConsent;
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>SHOWCASE</small>
          <h3>Widget Builder con consentimiento</h3>
          <p>
            Convierte prueba social en activos web sin reutilizar feedback
            privado ni reviews sin permiso cuando se requiera.
          </p>
        </div>
        <button
          className="primary"
          onClick={() =>
            onSave({
              layout,
              minRating,
              sources: ["Google", "Facebook"],
              consentRequired: consent,
            })
          }
        >
          Guardar y recalcular
        </button>
      </div>
      <div className="rep-v26-showcase-config">
        <label>
          Diseño
          <select value={layout} onChange={(e) => setLayout(e.target.value)}>
            <option value="carousel">Carrusel</option>
            <option value="grid">Grid</option>
            <option value="testimonial">Testimonial</option>
            <option value="badge">Rating Badge</option>
          </select>
        </label>
        <label>
          Rating mínimo
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
          >
            {[5, 4, 3].map((v) => (
              <option key={v} value={v}>
                {v}★+
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          Exigir consentimiento
        </label>
        <div>
          <b>{s(data.eligibleCount)}</b>
          <span>reviews elegibles</span>
        </div>
      </div>
      <div className="rep-v26-widget-preview-head">
        <div>
          <small>VISTA PREVIA WEB</small>
          <b>
            {layout === "carousel"
              ? "Carrusel"
              : layout === "grid"
                ? "Grid"
                : layout === "testimonial"
                  ? "Testimonial"
                  : "Rating Badge"}
          </b>
        </div>
        <span className={policyDirty ? "preview-policy-pending" : ""}>
          {policyDirty
            ? `Vista previa según política guardada (${s(data.eligibleCount)} elegibles). Guarda para recalcular.`
            : `${s(data.eligibleCount)} elegibles con la política guardada`}
        </span>
      </div>
      <div className={`rep-v26-showcase-preview layout-${layout}`}>
        {previewCandidates.slice(0, 6).map((review) => (
          <article key={s(review.id)}>
            <div>
              {Array.from({ length: n(review.rating) }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
            <p>“{s(review.body)}”</p>
            <footer>
              <b>{s(review.author)}</b>
              <span>
                {s(review.source)} · {s(review.consent)}
              </span>
            </footer>
          </article>
        ))}
      </div>
      {blockedCandidates.length ? (
        <div className="rep-v26-showcase-blocked-note">
          <ShieldCheck size={15} />
          <span>
            {blockedCandidates.length} candidata(s) bloqueada(s) por la política
            vigente no se muestran dentro de la vista previa pública.
          </span>
        </div>
      ) : null}
      <div className="rep-v26-embed-box">
        <div>
          <small>CÓDIGO DE INTEGRACIÓN</small>
          <code>{s(data.embedPreview)}</code>
        </div>
        <button
          onClick={() => {
            if (navigator.clipboard) {
              void navigator.clipboard.writeText(s(data.embedPreview, ""));
            }
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "Copiado" : "Copiar código"}
        </button>
      </div>
      <div className="rep-v26-tip">
        <UserCheck />
        <div>
          <b>Consentimiento primero</b>
          <span>
            Las candidatas bloqueadas no entran al widget hasta cumplir la
            política configurada.
          </span>
        </div>
      </div>
    </div>
  );
}

function AutomationView({
  rules,
  onToggle,
}: {
  rules: Row[];
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [testedRule, setTestedRule] = useState<string | null>(null);
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>AUTOMATIZACIÓN</small>
          <h3>Reglas operativas con límites claros</h3>
          <p>
            Las reglas priorizan, alertan y preparan trabajo; ninguna publica
            respuestas o manipula quién puede reseñar sin control.
          </p>
        </div>
      </div>
      {testedRule ? (
        <div className="rep-v26-rule-test">
          <ShieldCheck size={16} />
          <span>
            Prueba simulada de <b>{testedRule}</b>: se evaluó la lógica sobre la
            muestra operativa. No se creó ninguna acción ni se publicó contenido
            externo.
          </span>
        </div>
      ) : null}
      <div className="rep-v26-rules">
        {rules.map((rule) => (
          <article key={s(rule.id)}>
            <div className="rule-icon">
              <Bot />
            </div>
            <div>
              <h4>{s(rule.name)}</h4>
              <p>
                <b>Cuando:</b> {s(rule.condition)}
              </p>
              <div>
                {Array.isArray(rule.actions)
                  ? (rule.actions as unknown[]).map((action) => (
                      <span key={String(action)}>{String(action)}</span>
                    ))
                  : null}
              </div>
            </div>
            <div className="rule-actions">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={Boolean(rule.enabled)}
                  onChange={(e) => onToggle(s(rule.id), e.target.checked)}
                />
                <i />
              </label>
              <button onClick={() => setTestedRule(s(rule.name))}>
                Probar regla
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HistoryView({
  history,
  range,
  setRange,
}: {
  history: Row[];
  range: number;
  setRange: (v: number) => void;
}) {
  const maxPoints =
    range <= 30
      ? 4
      : range <= 90
        ? 6
        : range <= 180
          ? 8
          : range <= 365
            ? 12
            : 18;
  const points = history.slice(-maxPoints);
  const series = [
    "rating",
    "reviews",
    "responseRate",
    "responseHours",
    "positiveSentiment",
    "nps",
  ];
  const [metric, setMetric] = useState("reviews");
  const vals = points.map((p) => n(p[metric]));
  const min = Math.min(...vals, 0),
    max = Math.max(...vals, 1);
  const coords = vals
    .map(
      (v, i) =>
        `${points.length <= 1 ? 50 : (i / (points.length - 1)) * 100},${88 - ((v - min) / Math.max(1, max - min)) * 70}`,
    )
    .join(" ");
  return (
    <div className="rep-v26-content">
      <div className="rep-v26-section-title">
        <div>
          <small>HISTORIAL</small>
          <h3>Evolución de reputación</h3>
          <p>
            Sin snapshots repetidos: una serie temporal comparable con cambios y
            fuente canónica.
          </p>
        </div>
        <div className="range">
          {[30, 90, 180, 365, 548].map((v) => (
            <button
              className={range === v ? "active" : ""}
              key={v}
              onClick={() => setRange(v)}
            >
              {v === 365 ? "12m" : v === 548 ? "18m" : `${v}d`}
            </button>
          ))}
        </div>
      </div>
      <div className="rep-v26-history-integrity">
        <ShieldCheck size={15} />
        <span>
          {points.length} fechas únicas · snapshots del mismo día se reconcilian
          antes de entrar a la serie · fecha canónica actual{" "}
          {s(
            points.find((p) => s(p.source) === "Canonical Review Store")?.date,
          )}
          .
        </span>
      </div>
      <div className="rep-v26-history-controls">
        {series.map((key) => (
          <button
            className={metric === key ? "active" : ""}
            key={key}
            onClick={() => setMetric(key)}
          >
            {key === "responseRate"
              ? "Tasa respuesta"
              : key === "responseHours"
                ? "SLA"
                : key === "positiveSentiment"
                  ? "Sentimiento"
                  : key === "reviews"
                    ? "Reviews"
                    : key === "rating"
                      ? "Rating"
                      : "NPS"}
          </button>
        ))}
      </div>
      <div className="rep-v26-chart">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={coords}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="chart-labels">
          {points.map((p) => (
            <span key={s(p.date)}>{s(p.date).slice(5)}</span>
          ))}
        </div>
      </div>
      <div className="rep-v26-history-table">
        {points
          .slice()
          .reverse()
          .map((p, i) => (
            <div key={`${s(p.date)}-${i}`}>
              <b>{dateLabel(p.date)}</b>
              <span>{ratingStars(p.rating)}</span>
              <span>{s(p.reviews)} reviews</span>
              <span>{pct(p.responseRate)} respuesta</span>
              <span>{s(p.responseHours)} h</span>
              <span>{pct(p.positiveSentiment)} positivo</span>
              <span className="history-source">
                {s(p.source)}
                {n(p.snapshotCount) > 1
                  ? ` · ${s(p.snapshotCount)} snapshots`
                  : ""}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ResponseModal({
  review,
  text,
  setText,
  tone,
  generating,
  canPublishExternally,
  onSuggest,
  onSave,
  onClose,
}: {
  review: Row;
  text: string;
  setText: (v: string) => void;
  tone: string;
  generating: boolean;
  canPublishExternally: boolean;
  onSuggest: (v: string) => void;
  onSave: (publish: boolean) => void;
  onClose: () => void;
}) {
  const canApprove = text.trim().length > 0 && !generating;
  return (
    <div
      className="rep-v26-modal-bg"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="rep-v26-modal">
        <header>
          <div>
            <small>RESPONSE CENTER</small>
            <h3>
              {s(review.author)} · {s(review.rating)}★
            </h3>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </header>
        <section className="original">
          <div>
            <span>
              {s(review.source)} · {toneLabel(review.sentiment)} · Riesgo{" "}
              {s(review.riskScore)}/100
            </span>
            <b>Tema: {s(review.theme)}</b>
          </div>
          <blockquote>“{s(review.body)}”</blockquote>
        </section>
        <section>
          <label>Asistencia de redacción</label>
          <div className="tone-buttons">
            {[
              ["professional", "Profesional"],
              ["empathetic", "Empática"],
              ["brief", "Breve"],
              ["resolution", "Resolver incidencia"],
            ].map(([key, label]) => (
              <button
                className={tone === key ? "active" : ""}
                key={key}
                disabled={generating}
                onClick={() => onSuggest(key)}
              >
                <WandSparkles size={13} />
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              generating
                ? "Generando borrador asistido…"
                : "Redacta o genera una respuesta…"
            }
          />
          {generating ? (
            <small className="rep-v26-response-generating">
              Generando una propuesta editable. No se aprobará ni publicará
              automáticamente.
            </small>
          ) : null}
        </section>
        <div className="rep-v26-modal-note">
          <ShieldCheck />
          <span>
            {canPublishExternally
              ? "La sugerencia se edita y aprueba antes de publicar. Existe un conector externo compatible para esta fuente."
              : "La sugerencia se edita y aprueba antes de publicar. Sin conector externo compatible, la aprobación queda trazada dentro de SEOLOCAL y la publicación externa permanece pendiente."}
          </span>
        </div>
        <footer>
          <button onClick={onClose}>Cancelar</button>
          <button disabled={!canApprove} onClick={() => onSave(false)}>
            Aprobar borrador
          </button>
          <button
            className="primary"
            disabled={!canApprove}
            onClick={() => onSave(true)}
          >
            <Send size={14} />
            {canPublishExternally
              ? "Aprobar y publicar"
              : "Aprobar · publicación pendiente"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CampaignModal({
  value,
  setValue,
  onSave,
  onClose,
}: {
  value: Row;
  setValue: (v: Row) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="rep-v26-modal-bg"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="rep-v26-modal small">
        <header>
          <div>
            <small>CAMPAÑA</small>
            <h3>Nueva campaña de reviews</h3>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="rep-v26-form">
          <label>
            Nombre
            <input
              value={s(value.name, "")}
              onChange={(e) => setValue({ ...value, name: e.target.value })}
            />
          </label>
          <label>
            Canal
            <select
              value={s(value.channel, "sms")}
              onChange={(e) => setValue({ ...value, channel: e.target.value })}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="qr">QR</option>
              <option value="link">Link</option>
              <option value="kiosk">Kiosk</option>
            </select>
          </label>
          <label>
            Trigger
            <input
              value={s(value.trigger, "")}
              onChange={(e) => setValue({ ...value, trigger: e.target.value })}
            />
          </label>
          <div className="two">
            <label>
              Espera (h)
              <input
                type="number"
                value={n(value.delayHours)}
                onChange={(e) =>
                  setValue({ ...value, delayHours: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Follow-up (h)
              <input
                type="number"
                value={n(value.followUpHours)}
                onChange={(e) =>
                  setValue({ ...value, followUpHours: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label>
            Audiencia
            <input
              type="number"
              value={n(value.audience)}
              onChange={(e) =>
                setValue({ ...value, audience: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <div className="rep-v26-modal-note">
          <QrCode />
          <span>
            La campaña se crea en PostgreSQL como borrador. Local Lab no simula
            una entrega externa real.
          </span>
        </div>
        <footer>
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={onSave}>
            Crear campaña
          </button>
        </footer>
      </div>
    </div>
  );
}
