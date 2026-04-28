/**
 * Knowledge Analytics Module
 * Insights, patterns, and statistics about your knowledge base
 * Free tier: basic stats | Pro tier: advanced analytics
 */
import { searchKnowledge } from "./core.js";
import { listTags } from "./core.js";
// ============================================================
// Analytics Functions
// ============================================================
export async function getAnalyticsOverview(vaultPath) {
    try {
        const allKnowledge = await searchKnowledge({ query: "", limit: 10000 });
        const tags = await listTags();
        // Type breakdown
        const typesBreakdown = {};
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
    finally {
    }
}
try { }
catch (error) {
    return {
        totalItems: 0, totalTags: 0, totalLinks: 0,
        typesBreakdown: {}, topTags: [], recentActivity: [],
        oldestItem: null, newestItem: null,
        averageContentLength: 0, knowledgeHealth: 0,
    };
}
export async function getAnalyticsInsights(vaultPath) {
    const allKnowledge = await searchKnowledge({ query: "", limit: 10000 });
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
    const duplicateCandidates = new Set();
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
export async function getAnalyticsTimeline(vaultPath) {
    const allKnowledge = await searchKnowledge({ query: "", limit: 10000 });
    const daily = {};
    const weekly = {};
    const monthly = {};
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
function similarity(a, b) {
    if (a === b)
        return 1;
    if (a.length === 0 || b.length === 0)
        return 0;
    // Simple Jaccard on words
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
}
function getWeekKey(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
}
//# sourceMappingURL=analytics.js.map