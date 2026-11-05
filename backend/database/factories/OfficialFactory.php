<?php

namespace Database\Factories;

use App\Enums\Branch;
use App\Models\Official;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Official>
 */
class OfficialFactory extends Factory
{
    protected $model = Official::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch' => Branch::Legislative,
            'position' => 'City Councilor',
            'name' => fake()->name(),
            'photo_path' => null,
            'committee' => null,
            'is_principal' => false,
            'message' => null,
            'sort_order' => 0,
            'is_published' => true,
            'is_demo' => false,
        ];
    }

    /** The Mayor, with a message for the Mayor's Desk. */
    public function mayor(?string $message = 'A message from the Mayor.'): static
    {
        return $this->state(fn (): array => [
            'branch' => Branch::Executive,
            'position' => 'City Mayor',
            'is_principal' => true,
            'message' => $message,
        ]);
    }

    public function viceMayor(): static
    {
        return $this->state(fn (): array => [
            'branch' => Branch::Legislative,
            'position' => 'City Vice Mayor',
            'is_principal' => true,
        ]);
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
