<?php

namespace Database\Factories;

use App\Models\Recognition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Recognition>
 */
class RecognitionFactory extends Factory
{
    protected $model = Recognition::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => rtrim(fake()->sentence(4), '.'),
            'conferred_by' => fake()->company(),
            'year' => now()->year,
            'badge_path' => null,
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
