<?php

namespace Database\Factories;

use App\Models\Event;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => rtrim(fake()->sentence(4), '.'),
            'description' => fake()->sentence(12),
            'venue' => fake()->streetName(),
            'starts_at' => now()->addWeek(),
            'ends_at' => null,
            'is_published' => true,
            'is_demo' => false,
        ];
    }

    /** Starting at a given moment and, optionally, running until another. */
    public function on(DateTimeInterface $startsAt, ?DateTimeInterface $endsAt = null): static
    {
        return $this->state(fn (): array => ['starts_at' => $startsAt, 'ends_at' => $endsAt]);
    }

    public function unpublished(): static
    {
        return $this->state(fn (): array => ['is_published' => false]);
    }

    public function demo(): static
    {
        return $this->state(fn (): array => ['is_demo' => true]);
    }
}
