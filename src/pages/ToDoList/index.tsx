// src/pages/ToDoList/index.tsx
import React, { useState } from "react";
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
import { Input, Button, List, Checkbox, Typography, Space, message, Modal, Spin } from "antd";
import type { ToDoItem } from "@/types/toDoList";
import { Timestamp } from "firebase/firestore";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

// สร้าง queryOptions แยกเพื่อจัดการ error
const todoQueryOptions = {
  queryKey: ['todos'],
  queryFn: getToDoList,
  // ตัวเลือกอื่นๆ เช่น staleTime, retry, etc.
};

const ToDoList: React.FC = () => {
  const [input, setInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null); // สำหรับ controlled modal
  const queryClient = useQueryClient();

  // ใช้ useQuery แบบถูกต้องใน v5+
  const {
    data: tasks = [],
    isLoading,
    error: queryError
  } = useQuery(todoQueryOptions);

  // แสดง error ถ้ามี
  React.useEffect(() => {
    if (queryError) {
      message.error(`โหลดข้อมูลไม่สำเร็จ: ${queryError.message}`);
    }
  }, [queryError]);

  // Mutation สำหรับเพิ่มข้อมูล
  const addMutation = useMutation({
    mutationFn: (newTodo: Omit<ToDoItem, 'id'>) => addToDo(newTodo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      message.success("เพิ่มสำเร็จ");
      setInput("");
    },
    onError: (error: Error) => {
      message.error(`เพิ่มไม่สำเร็จ: ${error.message}`);
    }
  });

  // Mutation สำหรับอัปเดต
  const updateMutation = useMutation({
    mutationFn: (params: { id: string } & Partial<ToDoItem>) =>
      updateToDo(params),
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries(todoQueryOptions);
      const previousTodos = queryClient.getQueryData(todoQueryOptions.queryKey);

      queryClient.setQueryData(todoQueryOptions.queryKey, (old: ToDoItem[] | undefined) =>
        old?.map(item =>
          item.id === updatedTodo.id ? { ...item, ...updatedTodo } : item
        ) || []
      );

      return { previousTodos };
    },
    onError: (error, _variables, context) => {
      message.error(`อัปเดตไม่สำเร็จ: ${error.message}`);
      if (context?.previousTodos) {
        queryClient.setQueryData(todoQueryOptions.queryKey, context.previousTodos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(todoQueryOptions);
    }
  });

  // Mutation สำหรับลบ
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteToDo(id),
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

    addMutation.mutate({
      text,
      completed: false,
      createdAt: Timestamp.now()
    });
  };

  const handleToggle = (item: ToDoItem) => {
    if (!item.id) return;

    updateMutation.mutate({
      id: item.id,
      completed: !item.completed,
      updatedAt: Timestamp.now()
    });
  };

  // กด "ลบ" ในแต่ละรายการ: เปิด modal ลบ
  const handleDeleteRequest = (id?: string) => {
    if (!id) {
      message.error("ไม่พบ id ของรายการนี้");
      return;
    }
    setDeleteId(id);
  };

  // ยืนยันลบใน modal
  const handleConfirmDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setDeleteId(null);
  };

  // ยกเลิก modal
  const handleCancelDelete = () => setDeleteId(null);

  // --- Group tasks by date ---
  const tasksByDate = groupTasksByDate(tasks);
  // เรียงวันที่ (ล่าสุดอยู่บน)
  const dateKeys = Object.keys(tasksByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: "0 16px" }}>

      <Space.Compact style={{ width: "100%", marginBottom: 24 }}>
        <Input
          placeholder="My Todo's"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleAdd}
          disabled={addMutation.isPending}
        />
        <Button
          type="primary"
          onClick={handleAdd}
          loading={addMutation.isPending}
        >
          <PlusOutlined /> Add
        </Button>
      </Space.Compact>

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
                      >
                        <DeleteOutlined /> Delete
                      </Button>
                    ]}
                  >
                    <Checkbox
                      checked={task.completed}
                      onChange={() => handleToggle(task)}
                      disabled={updateMutation.isPending}
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 24
        }}>
          <Button type="primary" onClick={handleConfirmDelete} loading={deleteMutation.isPending}>
            Yes
          </Button>
          <Button onClick={handleCancelDelete}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ToDoList;


// ==== utility function สำหรับ group ตามวัน ====
function groupTasksByDate(tasks: ToDoItem[]): Record<string, ToDoItem[]> {
  return tasks.reduce((acc, item) => {
    const dateObj = item.createdAt?.toDate?.() || new Date();
    // yyyy-mm-dd ของไทย (หรือจะใช้ en-US ก็ได้)
    const dateStr = dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {} as Record<string, ToDoItem[]>);
}
