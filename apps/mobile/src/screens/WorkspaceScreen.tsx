import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Home, LogOut, Plus, RefreshCw, Search, Settings, UserRound } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { MemoSummary, Notebook } from "@edgeever/shared";
import { useSession } from "../lib/session";

const ALL_NOTES_ID = "all";

export const WorkspaceScreen = () => {
  const { client, session, signOut } = useSession();
  const queryClient = useQueryClient();
  const [activeNotebookId, setActiveNotebookId] = useState<string>(ALL_NOTES_ID);
  const [selectedMemo, setSelectedMemo] = useState<MemoSummary | null>(null);

  const notebooksQuery = useQuery({
    queryKey: ["mobile", "notebooks"],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client is not ready");
      }

      return client.listNotebooks();
    },
    enabled: Boolean(client),
  });

  const activeNotebook = useMemo(
    () => notebooksQuery.data?.notebooks.find((notebook) => notebook.id === activeNotebookId) ?? null,
    [activeNotebookId, notebooksQuery.data?.notebooks]
  );

  const memosQuery = useQuery({
    queryKey: ["mobile", "memos", activeNotebookId],
    queryFn: async () => {
      if (!client) {
        throw new Error("Client is not ready");
      }

      return client.listMemos({
        notebookId: activeNotebookId === ALL_NOTES_ID ? null : activeNotebookId,
        limit: 50,
        sort: "updated-desc",
      });
    },
    enabled: Boolean(client),
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mobile", "notebooks"] }),
      queryClient.invalidateQueries({ queryKey: ["mobile", "memos"] }),
    ]);
  };

  const isRefreshing = notebooksQuery.isFetching || memosQuery.isFetching;
  const notebooks = notebooksQuery.data?.notebooks ?? [];
  const memos = memosQuery.data?.memos ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>EdgeEver</Text>
          <Text numberOfLines={1} style={styles.instance}>
            {session?.baseUrl}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={refresh} style={styles.iconButton}>
            <RefreshCw color="#0f172a" size={18} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={signOut} style={styles.iconButton}>
            <LogOut color="#0f172a" size={18} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <NotebookPill
            active={activeNotebookId === ALL_NOTES_ID}
            label="全部笔记"
            memoCount={notebooks.reduce((total, notebook) => total + notebook.memoCount, 0)}
            onPress={() => setActiveNotebookId(ALL_NOTES_ID)}
          />
          {notebooks.map((notebook) => (
            <NotebookPill
              active={activeNotebookId === notebook.id}
              key={notebook.id}
              label={notebook.name}
              memoCount={notebook.memoCount}
              onPress={() => setActiveNotebookId(notebook.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentHeader}>
        <View>
          <Text style={styles.sectionTitle}>{activeNotebook?.name ?? "全部笔记"}</Text>
          <Text style={styles.sectionSubtitle}>{memosQuery.data?.totalCount ?? memos.length} 条笔记</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.primaryIconButton}>
          <Plus color="#ffffff" size={20} />
        </Pressable>
      </View>

      {memosQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#0f172a" />
        </View>
      ) : memosQuery.isError ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>加载失败</Text>
          <Text style={styles.mutedText}>{memosQuery.error instanceof Error ? memosQuery.error.message : "请稍后再试"}</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={memos.length === 0 ? styles.emptyList : styles.list}
          data={memos}
          keyExtractor={(memo) => memo.id}
          refreshControl={<RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor="#0f172a" />}
          renderItem={({ item }) => <MemoCard memo={item} onPress={() => setSelectedMemo(item)} selected={selectedMemo?.id === item.id} />}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <BookOpen color="#94a3b8" size={32} />
              <Text style={styles.emptyTitle}>暂无笔记</Text>
              <Text style={styles.mutedText}>点右上角按钮创建第一条笔记</Text>
            </View>
          }
        />
      )}

      {selectedMemo ? <MemoPreview memo={selectedMemo} /> : null}

      <View style={styles.bottomNav}>
        <BottomNavItem active icon={<Home color="#0f172a" size={20} />} label="笔记" />
        <BottomNavItem icon={<Search color="#64748b" size={20} />} label="搜索" />
        <BottomNavItem icon={<UserRound color="#64748b" size={20} />} label="账户" />
        <BottomNavItem icon={<Settings color="#64748b" size={20} />} label="设置" />
      </View>
    </SafeAreaView>
  );
};

const NotebookPill = ({
  active,
  label,
  memoCount,
  onPress,
}: {
  active: boolean;
  label: string;
  memoCount: number;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={[styles.notebookPill, active && styles.notebookPillActive]}>
    <Text numberOfLines={1} style={[styles.notebookPillText, active && styles.notebookPillTextActive]}>
      {label}
    </Text>
    <Text style={[styles.notebookPillCount, active && styles.notebookPillTextActive]}>{memoCount}</Text>
  </Pressable>
);

const MemoCard = ({ memo, onPress, selected }: { memo: MemoSummary; onPress: () => void; selected: boolean }) => (
  <Pressable onPress={onPress} style={[styles.memoCard, selected && styles.memoCardSelected]}>
    <View style={styles.memoCardTop}>
      <Text numberOfLines={1} style={styles.memoTitle}>
        {memo.title?.trim() || "无标题笔记"}
      </Text>
      {memo.isPinned ? <Text style={styles.pinText}>置顶</Text> : null}
    </View>
    <Text numberOfLines={2} style={styles.memoExcerpt}>
      {memo.excerpt || "没有正文预览"}
    </Text>
    <View style={styles.memoMeta}>
      <Text style={styles.memoDate}>{formatDate(memo.updatedAt)}</Text>
      {memo.tags.slice(0, 2).map((tag) => (
        <Text key={tag} style={styles.tag}>
          #{tag}
        </Text>
      ))}
    </View>
  </Pressable>
);

const MemoPreview = ({ memo }: { memo: MemoSummary }) => (
  <View style={styles.preview}>
    <Text numberOfLines={1} style={styles.previewTitle}>
      {memo.title?.trim() || "无标题笔记"}
    </Text>
    <Text numberOfLines={3} style={styles.previewText}>
      {memo.excerpt || "没有正文预览"}
    </Text>
  </View>
);

const BottomNavItem = ({ active = false, icon, label }: { active?: boolean; icon: ReactNode; label: string }) => (
  <Pressable style={styles.bottomNavItem}>
    {icon}
    <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>{label}</Text>
  </Pressable>
);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#f8fafc",
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "800",
  },
  instance: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
    maxWidth: 230,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  tabs: {
    paddingLeft: 18,
    paddingTop: 18,
  },
  notebookPill: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
    maxWidth: 190,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  notebookPillActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  notebookPillText: {
    color: "#334155",
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  notebookPillTextActive: {
    color: "#ffffff",
  },
  notebookPillCount: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  contentHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 21,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  primaryIconButton: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  list: {
    paddingBottom: 150,
    paddingHorizontal: 18,
  },
  emptyList: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  memoCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  memoCardSelected: {
    borderColor: "#0f172a",
  },
  memoCardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  memoTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  pinText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "800",
  },
  memoExcerpt: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  memoMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  memoDate: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  tag: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "800",
  },
  emptyTitle: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "800",
  },
  mutedText: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
  },
  preview: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    bottom: 78,
    left: 18,
    padding: 14,
    position: "absolute",
    right: 18,
  },
  previewTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  previewText: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  bottomNav: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-around",
    left: 0,
    position: "absolute",
    right: 0,
  },
  bottomNavItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 58,
  },
  bottomNavText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  bottomNavTextActive: {
    color: "#0f172a",
  },
});
