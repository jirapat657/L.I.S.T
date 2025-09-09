// src/pages/ToDoList/index.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import {
  getToDoList,
  addToDo,
  updateToDo,
  deleteToDo,
} from "@/api/toDoList";
import { Input, Button, List, Checkbox, Typography, Space, message, Modal, Spin, Segmented } from "antd";
import type { ToDoItem } from "@/types/toDoList";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { auth } from "@/services/firebase"; // ★ ต้อง export auth มาจาก services/firebase
import { groupTasksByDate } from "@/utils/groupTasksByDate";

const { Title, Text } = Typography;

type StatusFilter = 'all' | 'active' | 'completed';

const ToDoList: React.FC = () => {
  const [input, setInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const queryClient = useQueryClient();

  // ★ ดึง uid จาก Firebase Auth (ถ้าคุณมี useAuth hook ก็ใช้แทนได้)
  const uid = auth.currentUser?.uid;

  // ถ้าไม่มี uid ให้แจ้งผู้ใช้ (กันเคสยังไม่ล็อกอิน)
  useEffect(() => {
    if (!uid) {
      message.warning("กรุณาเข้าสู่ระบบเพื่อใช้งาน To-Do");
    }
  }, [uid]);

  // ★ queryOptions ต้องผูกกับ uid (key ควรรวม uid เพื่อแยก cache ต่อผู้ใช้)
  const todoQueryOptions = {
    queryKey: ['todos', uid],
    queryFn: () => {
      if (!uid) throw new Error("ยังไม่พบผู้ใช้ (uid)");
      return getToDoList(uid);
    },
    enabled: !!uid, // รอจนมี uid ก่อนค่อยยิง
    // staleTime, retry ฯลฯ ใส่เพิ่มได้
  };

  const {
    data: tasks = [],
    isLoading,
    error: queryError
  } = useQuery(todoQueryOptions);

  useEffect(() => {
    if (queryError instanceof Error) {
      message.error(`โหลดข้อมูลไม่สำเร็จ: ${queryError.message}`);
    }
  }, [queryError]);

  // ★ เพิ่มข้อมูล (อย่าส่ง createdAt จาก client — API จะใส่ serverTimestamp ให้)
  const addMutation = useMutation({
    mutationFn: async (payload: { text: string }) => {
      if (!uid) throw new Error("ยังไม่พบผู้ใช้ (uid)");
      return addToDo(uid, {
        text: payload.text,
        completed: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', uid] });
      message.success("เพิ่มสำเร็จ");
      setInput("");
    },
    onError: (error: Error) => {
      message.error(`เพิ่มไม่สำเร็จ: ${error.message}`);
    }
  });

  // ★ อัปเดต (ส่ง uid เข้า API เสมอ)
  const updateMutation = useMutation({
    mutationFn: async (params: { id: string } & Partial<ToDoItem>) => {
      if (!uid) throw new Error("ยังไม่พบผู้ใช้ (uid)");
      // ไม่ต้องแนบ updatedAt จาก client
      return updateToDo(uid, params);
    },
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries(todoQueryOptions);
      const previousTodos = queryClient.getQueryData<ToDoItem[]>(todoQueryOptions.queryKey);

      // optimistic update
      queryClient.setQueryData<ToDoItem[]>(todoQueryOptions.queryKey, (old = []) =>
        old.map(item =>
          item.id === updatedTodo.id ? { ...item, ...updatedTodo } : item
        )
      );

      return { previousTodos };
    },
    onError: (error, _variables, context) => {
      message.error(`อัปเดตไม่สำเร็จ: ${(error as Error).message}`);
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryOptions.queryKey, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(todoQueryOptions);
    }
  });

  // ★ ลบ (ส่ง uid เข้า API)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!uid) throw new Error("ยังไม่พบผู้ใช้ (uid)");
      return deleteToDo(uid, id);
    },
    onSuccess: () => {
      message.success("ลบสำเร็จ");
      queryClient.invalidateQueries(todoQueryOptions);
    },
    onError: (error: Error) => {
      message.error(`ลบไม่สำเร็จ: ${error?.message ?? error}`);
      console.error("Delete mutation error:", error);
    }
  });

  const handleAdd = () => {
    const text = input.trim();
    if (!text) {
      message.warning("กรุณากรอกข้อความ");
      return;
    }
    addMutation.mutate({ text });
  };

  const handleToggle = (item: ToDoItem) => {
    if (!item.id) return;
    updateMutation.mutate({
      id: item.id,
      completed: !item.completed,
    });
  };

  const handleDeleteRequest = (id?: string) => {
    if (!id) {
      message.error("ไม่พบ id ของรายการนี้");
      return;
    }
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setDeleteId(null);
  };

  const handleCancelDelete = () => setDeleteId(null);

  // ★ กรองตามสถานะ
  const filteredTasks = useMemo(() => {
    switch (statusFilter) {
      case 'active':
        return tasks.filter(t => !t.completed);
      case 'completed':
        return tasks.filter(t => !!t.completed);
      default:
        return tasks;
    }
  }, [tasks, statusFilter]);

  // ★ Group tasks by date (ใช้ memo ลดคำนวณซ้ำ)
  const tasksByDate = useMemo(() => groupTasksByDate(filteredTasks), [filteredTasks]);
  const dateKeys = useMemo(() =>
    Object.keys(tasksByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [tasksByDate]
  );

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px" }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <Space.Compact style={{ flex: 1 }}>
          <Input
            placeholder="My Todo's"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleAdd}
            disabled={addMutation.isPending || !uid}
          />
          <Button
            type="primary"
            onClick={handleAdd}
            loading={addMutation.isPending}
            disabled={!uid}
          >
            <PlusOutlined /> Add
          </Button>
        </Space.Compact>

        {/* ★ ตัวกรองสถานะ */}
        <Segmented<StatusFilter>
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Spin tip="กำลังโหลด..." />
        </div>
      ) : (
        dateKeys.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888" }}>ไม่มีรายการ</div>
        ) : (
          dateKeys.map(dateStr => (
            <div key={dateStr} style={{ marginBottom: 32 }}>
              <Title level={4} style={{ margin: '16px 0 8px' }}>
                {dateStr}
              </Title>
              <List
                bordered
                dataSource={tasksByDate[dateStr]}
                renderItem={(task) => (
                  <List.Item
                    key={task.id}
                    actions={[
                      <Button
                        danger
                        size="small"
                        onClick={() => handleDeleteRequest(task.id)}
                        loading={deleteMutation.variables === task.id && deleteMutation.isPending}
                        disabled={!uid}
                      >
                        <DeleteOutlined /> Delete
                      </Button>
                    ]}
                  >
                    <Checkbox
                      checked={task.completed}
                      onChange={() => handleToggle(task)}
                      disabled={updateMutation.isPending || !uid}
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        textDecoration: task.completed ? "line-through" : "none",
                        color: task.completed ? "#999" : "inherit",
                      }}
                    >
                      {task.text}
                    </Text>
                  </List.Item>
                )}
              />
            </div>
          ))
        )
      )}

      {/* Modal ลบ */}
      <Modal
        open={!!deleteId}
        onCancel={handleCancelDelete}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", fontSize: 16 }}>
          คุณต้องการลบ To-Do นี้จริงหรือไม่?
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <Button type="primary" onClick={handleConfirmDelete} loading={deleteMutation.isPending}>
            Yes
          </Button>
          <Button onClick={handleCancelDelete}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ToDoList;
