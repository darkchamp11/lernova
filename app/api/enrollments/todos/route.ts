import { and, eq, max } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { enrollmentTodos } from '@/src/db/schema';

/**
 * PATCH — Toggle a to-do item's completion status.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { todoId, completed } = body;

    if (todoId === undefined || completed === undefined) {
      return NextResponse.json(
        { error: 'todoId and completed are required' },
        { status: 400 },
      );
    }

    const result = await db
      .update(enrollmentTodos)
      .set({
        completed: completed ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(enrollmentTodos.id, todoId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ todo: result[0] });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

/**
 * POST — Add a custom to-do item to an enrollment.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentId, title } = body;

    if (!enrollmentId || !title) {
      return NextResponse.json(
        { error: 'enrollmentId and title are required' },
        { status: 400 },
      );
    }

    if (title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Task title must be at least 3 characters' },
        { status: 400 },
      );
    }

    // Get the max sort order for this enrollment
    const maxOrder = await db
      .select({ max: max(enrollmentTodos.sortOrder) })
      .from(enrollmentTodos)
      .where(eq(enrollmentTodos.enrollmentId, enrollmentId));

    const nextOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [newTodo] = await db
      .insert(enrollmentTodos)
      .values({
        enrollmentId,
        title: title.trim(),
        completed: 0,
        isCustom: 1,
        sortOrder: nextOrder,
      })
      .returning();

    return NextResponse.json({ todo: newTodo });
  } catch (error) {
    console.error('Error adding todo:', error);
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a custom to-do item (only user-added ones).
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const todoId = searchParams.get('todoId');

    if (!todoId) {
      return NextResponse.json({ error: 'todoId is required' }, { status: 400 });
    }

    // Only allow deleting custom tasks
    const todo = await db
      .select()
      .from(enrollmentTodos)
      .where(eq(enrollmentTodos.id, Number(todoId)))
      .limit(1);

    if (todo.length === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    if (todo[0].isCustom !== 1) {
      return NextResponse.json(
        { error: 'Only custom tasks can be deleted' },
        { status: 403 },
      );
    }

    await db
      .delete(enrollmentTodos)
      .where(eq(enrollmentTodos.id, Number(todoId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
