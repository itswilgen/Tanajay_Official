<?php

namespace Database\Factories;

use App\Models\AgendaItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AgendaItem>
 */
class AgendaItemFactory extends Factory
{
    protected $model = AgendaItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => rtrim(fake()->sentence(2), '.'),
            'summary' => fake()->sentence(12),
            'sort_order' => 0,
            'is_published' => true,
            'is_demo' => false,
        ];
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
