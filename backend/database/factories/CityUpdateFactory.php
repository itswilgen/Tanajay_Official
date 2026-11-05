<?php

namespace Database\Factories;

use App\Models\CityUpdate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CityUpdate>
 */
class CityUpdateFactory extends Factory
{
    protected $model = CityUpdate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = rtrim(fake()->sentence(4), '.');

        return [
            'category' => 'Public works',
            'title' => $title,
            'slug' => fake()->unique()->slug(),
            'standfirst' => fake()->sentence(16),
            'body' => fake()->paragraphs(2, true),
            'published_at' => now()->subDay(),
            'sort_order' => 0,
            'is_published' => true,
            'is_demo' => false,
        ];
    }

    public function unpublished(): static
    {
        return $this->state(fn (): array => ['is_published' => false]);
    }

    /** Prepared but not yet released — dated ahead of today. */
    public function scheduled(): static
    {
        return $this->state(fn (): array => ['published_at' => now()->addWeek()]);
    }

    /** Published with no date at all, which is not a release either. */
    public function undated(): static
    {
        return $this->state(fn (): array => ['published_at' => null]);
    }

    public function demo(): static
    {
        return $this->state(fn (): array => ['is_demo' => true]);
    }
}
