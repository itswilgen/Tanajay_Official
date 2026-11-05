<?php

namespace Database\Factories;

use App\Models\Guide;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Guide>
 */
class GuideFactory extends Factory
{
    protected $model = Guide::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => rtrim(fake()->sentence(5), '.'),
            'summary' => fake()->sentence(12),
            'steps' => [fake()->sentence(), fake()->sentence(), fake()->sentence()],
            'requirements' => [fake()->sentence(3), fake()->sentence(3)],
            'fee' => null,
            'processing_time' => null,
            'office' => fake()->company(),
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
