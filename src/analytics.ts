/**
 * Knowledge Analytics Module
 * Insights, patterns, and statistics about your knowledge base
 * Free tier: basic stats | Pro tier: advanced analytics
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { listTags } from "./core.js";
import { loadGraph, type KnowledgeGraphIndex } from "./graph.js";

// Direct index reader — avoids searchKnowledge overhead for analytics
async function loadAllEntries(): Promise<KnowledgePoint[]> {
  const vaultDir = (process.env.KNOWLEDGE_KEEPER_DIR || "~/.knowledge-vault").replace("~", os.homedir());
  const indexPath = path.join(vaultDir, "index.json");
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const parsed = JSON.parse(content);
    return parsed.entries || [];
  } catch {
    return [];
  }
}

// Re-export KnowledgePoint type from core for local use
import type { KnowledgePoint } from "./core.js";

// ============================================================
// Types
// ============================================================

export interface AnalyticsOverview {
  totalItems: number;
  totalTags: number;
  totalLinks: number;
  typesBreakdown: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  recentActivity: Array<{ id: string; title: string; action: string; date: string }>;
  oldestItem: string | null;
  newestItem: string | null;
  averageContentLength: number;
  knowledgeHealth: number; // 0-100 score
}

export interface AnalyticsInsights {
  orphanItems: number;         // items with no tags and no links
  untaggedItems: number;       // items with 0 tags
  unlinkedItems: number;       // items with 0 links
  duplicateCandidates: number; // items with similar titles
  staleItems: number;          // items not updated in 30+ days
  reviewOverdue: number;       // items past review date
  connectivityScore: number;   // 0-100, how well-connected the KB is
  coverageScore: number;       // 0-100, how well-tagged the KB is
  freshnessScore: number;      // 0-100, how recently updated
}

export interface AnalyticsTimeline {
  daily: Record<string, number>;    // date -> items created
  weekly: Record<string, number>;   // week -> items created
  monthly: Record<string, number>;  // month -> items created
}

// ============================================================
// Analytics Functions
// ============================================================

export async function getAnalyticsOverview(vaultPath: string): Promise<AnalyticsOverview> {
  const allKnowledge = await loadAllEntries();
  const tags = await listTags();

  // Type breakdown
  const typesBreakdown: Record<string, number> = {};
  for (const item of allKnowledge) {
    typesBreakdown[item.type] = (typesBreakdown[item.type] || 0) + 1;
  }

  // Top tags
  const topTags = Object.entries(tags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Date range
  const sorted = [...allKnowledge].sort((a, b) => a.created.localeCompare(b.created));
  const oldestItem = sorted[0]?.created || null;
  const newestItem = sorted[sorted.length - 1]?.created || null;

  // Average content length
  const totalLength = allKnowledge.reduce((sum, item) => sum + item.content.length, 0);
  const averageContentLength = allKnowledge.length > 0 ? Math.round(totalLength / allKnowledge.length) : 0;

  // Count links
  let totalLinks = 0;
  for (const item of allKnowledge) {
    totalLinks += item.links?.length || 0;
  }

  // Knowledge health score
  const taggedRatio = allKnowledge.filter(i => i.tags.length > 0).length / Math.max(allKnowledge.length, 1);
  const linkedRatio = allKnowledge.filter(i => (i.links?.length || 0) > 0).length / Math.max(allKnowledge.length, 1);
  const knowledgeHealth = Math.round((taggedRatio * 40 + linkedRatio * 30 + Math.min(allKnowledge.length / 50, 1) * 30));

  return {
    totalItems: allKnowledge.length,
    totalTags: Object.keys(tags).length,
    totalLinks,
    typesBreakdown,
    topTags,
    recentActivity: allKnowledge.slice(0, 5).map(i => ({
      id: i.id,
      title: i.title,
      action: "created",
      date: i.created,
    })),
    oldestItem,
    newestItem,
    averageContentLength,
    knowledgeHealth,
  };
}

export async function getAnalyticsInsights(vaultPath: string): Promise<AnalyticsInsights> {
  const allKnowledge = await loadAllEntries();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Orphan items (no tags AND no links)
  const orphanItems = allKnowledge.filter(i => i.tags.length === 0 && (i.links?.length || 0) === 0).length;

  // Untagged
  const untaggedItems = allKnowledge.filter(i => i.tags.length === 0).length;

  // Unlinked
  const unlinkedItems = allKnowledge.filter(i => (i.links?.length || 0) === 0).length;

  // Stale (not updated in 30 days)
  const staleItems = allKnowledge.filter(i => i.updated < thirtyDaysAgo).length;

  // Duplicate candidates (similar titles)
  const titles = allKnowledge.map(i => i.title.toLowerCase());
  const duplicateCandidates = new Set<string>();
  for (let i = 0; i < titles.length; i++) {
    for (let j = i + 1; j < titles.length; j++) {
      if (titles[i] === titles[j] || similarity(titles[i], titles[j]) > 0.8) {
        duplicateCandidates.add(titles[i]);
      }
    }
  }

  // Scores
  const total = Math.max(allKnowledge.length, 1);
  const connectivityScore = Math.round((1 - unlinkedItems / total) * 100);
  const coverageScore = Math.round((1 - untaggedItems / total) * 100);
  const freshnessScore = Math.round((1 - staleItems / total) * 100);

  // Review overdue (simplified - check if updated > 7 days ago for review-able items)
  const reviewOverdue = allKnowledge.filter(i => i.updated < thirtyDaysAgo).length;

  return {
    orphanItems,
    untaggedItems,
    unlinkedItems,
    duplicateCandidates: duplicateCandidates.size,
    staleItems,
    reviewOverdue,
    connectivityScore,
    coverageScore,
    freshnessScore,
  };
}

export async function getAnalyticsTimeline(vaultPath: string): Promise<AnalyticsTimeline> {
  const allKnowledge = await loadAllEntries();

  const daily: Record<string, number> = {};
  const weekly: Record<string, number> = {};
  const monthly: Record<string, number> = {};

  for (const item of allKnowledge) {
    const date = item.created.split("T")[0]; // YYYY-MM-DD
    daily[date] = (daily[date] || 0) + 1;

    const weekDate = getWeekKey(date);
    weekly[weekDate] = (weekly[weekDate] || 0) + 1;

    const month = date.substring(0, 7); // YYYY-MM
    monthly[month] = (monthly[month] || 0) + 1;
  }

  return { daily, weekly, monthly };
}

// ============================================================
// Helpers
// ============================================================

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Simple Jaccard on words
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}
