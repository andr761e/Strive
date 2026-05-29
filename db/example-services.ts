import { Pool } from 'pg';

// Example PostgreSQL service functions for Strive.
// Adapt to your environment or ORM of choice.

const pool = new Pool({
  // connectionString: process.env.DATABASE_URL,
});

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  birthday: string;
  date_joined: string;
  created_at: string;
  updated_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_name: string;
  workout_date: string;
  duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutExercise = {
  id: string;
  workout_id: string;
  exercise_name: string;
  exercise_order: number;
  created_at: string;
  updated_at: string;
};

export type ExerciseSet = {
  id: string;
  workout_exercise_id: string;
  set_type: string;
  set_order: number;
  weight: number;
  reps: number;
  rir?: number | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export async function createUser(user: {
  name: string;
  username: string;
  email: string;
  birthday: string;
  date_joined: string;
}): Promise<User> {
  const result = await pool.query<User>(
    `INSERT INTO users (name, username, email, birthday, date_joined)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user.name, user.username, user.email, user.birthday, user.date_joined]
  );
  return result.rows[0];
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await pool.query<User>(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] ?? null;
}

export async function getUserProfileWithWorkouts(username: string) {
  const result = await pool.query(
    `SELECT
       u.*,
       json_agg(
         json_build_object(
           'id', w.id,
           'workout_name', w.workout_name,
           'workout_date', w.workout_date,
           'duration_minutes', w.duration_minutes,
           'created_at', w.created_at,
           'updated_at', w.updated_at,
           'exercises', (
             SELECT json_agg(
               json_build_object(
                 'id', we.id,
                 'exercise_name', we.exercise_name,
                 'exercise_order', we.exercise_order,
                 'sets', (
                   SELECT json_agg(
                     json_build_object(
                       'id', es.id,
                       'set_type', es.set_type,
                       'set_order', es.set_order,
                       'weight', es.weight,
                       'reps', es.reps,
                       'rir', es.rir,
                       'is_completed', es.is_completed,
                       'created_at', es.created_at,
                       'updated_at', es.updated_at
                     ) ORDER BY es.set_order
                   )
                   FROM exercise_sets es
                   WHERE es.workout_exercise_id = we.id
                 )
               ) ORDER BY we.exercise_order
             )
             FROM workout_exercises we
             WHERE we.workout_id = w.id
           )
         ) ORDER BY w.workout_date DESC
       ) AS workouts
     FROM users u
     LEFT JOIN workouts w ON w.user_id = u.id
     WHERE u.username = $1
     GROUP BY u.id`,
    [username]
  );

  return result.rows[0] ?? null;
}

export async function createLoggedWorkout(userId: string, workout: {
  workout_name: string;
  workout_date: string;
  duration_minutes?: number | null;
  exercises: Array<{ exercise_name: string; exercise_order: number; sets: Array<{ set_type: string; set_order: number; weight: number; reps: number; rir?: number | null; is_completed?: boolean; }> }>;
}): Promise<Workout> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const workoutResult = await client.query<Workout>(
      `INSERT INTO workouts (user_id, workout_name, workout_date, duration_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, workout.workout_name, workout.workout_date, workout.duration_minutes]
    );
    const createdWorkout = workoutResult.rows[0];

    for (const exercise of workout.exercises) {
      const exerciseResult = await client.query<WorkoutExercise>(
        `INSERT INTO workout_exercises (workout_id, exercise_name, exercise_order)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [createdWorkout.id, exercise.exercise_name, exercise.exercise_order]
      );
      const createdExercise = exerciseResult.rows[0];

      for (const set of exercise.sets) {
        await client.query(
          `INSERT INTO exercise_sets (workout_exercise_id, set_type, set_order, weight, reps, rir, is_completed)
           VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE))`,
          [createdExercise.id, set.set_type, set.set_order, set.weight, set.reps, set.rir ?? null, set.is_completed ?? true]
        );
      }
    }

    await client.query('COMMIT');
    return createdWorkout;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getWorkoutsForUser(userId: string): Promise<Workout[]> {
  const result = await pool.query<Workout>(
    `SELECT * FROM workouts WHERE user_id = $1 ORDER BY workout_date DESC`,
    [userId]
  );
  return result.rows;
}
