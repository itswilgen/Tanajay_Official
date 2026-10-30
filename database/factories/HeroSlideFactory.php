<?php

namespace Database\Factories;

use App\Models\HeroSlide;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HeroSlide>
 */
class HeroSlideFactory extends Factory
{
    protected $model = HeroSlide::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'category' => fake()->randomElement(['The city', 'City government', 'Community', 'Infrastructure']),
            'description' => fake()->sentence(12),
            'alt_text' => fake()->sentence(16),
            'image_path' => 'hero-slides/'.fake()->unique()->lexify('??????????').'.jpg',
            'sort_order' => fake()->numberBetween(1, 20),
            'is_published' => true,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn (): array => ['is_published' => false]);
    }
}
