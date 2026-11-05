<?php

namespace Database\Factories;

use App\Enums\PublicationStatus;
use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(6);

        return [
            'category' => fake()->randomElement(['Announcements', 'Events', 'Job Vacancies', 'Scholarships', 'Services']),
            'title' => $title,
            'slug' => str($title)->slug()->append('-', (string) fake()->unique()->numberBetween(1, 999999))->toString(),
            'description' => fake()->sentence(14),
            'body' => fake()->paragraphs(3, true),
            'requirements' => null,
            'poster_path' => null,
            'status' => PublicationStatus::Published,
            'is_demo' => false,
            'is_urgent' => false,
            'urgent_until' => null,
            'published_at' => now()->subDays(fake()->numberBetween(1, 60)),
        ];
    }

    /** A draft: saved by its office but not yet released to the public. */
    public function draft(): static
    {
        return $this->state(fn (): array => [
            'status' => PublicationStatus::Draft,
            'published_at' => null,
        ]);
    }

    /** Published, but dated in the future — scheduled, so still not public. */
    public function scheduled(): static
    {
        return $this->state(fn (): array => [
            'status' => PublicationStatus::Published,
            'published_at' => now()->addWeek(),
        ]);
    }

    public function demo(): static
    {
        return $this->state(fn (): array => ['is_demo' => true]);
    }

    /** Flagged for the alert band, optionally lapsing at `$until`. */
    public function urgent(?\DateTimeInterface $until = null): static
    {
        return $this->state(fn (): array => [
            'is_urgent' => true,
            'urgent_until' => $until,
        ]);
    }
}
