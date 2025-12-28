import { HeroSection } from "@/components/home/hero-section"
import { RecommendedSpots } from "@/components/home/recommended-spots"
import { FeaturedActivities } from "@/components/home/featured-activities"
import { LatestNews } from "@/components/home/latest-news"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <RecommendedSpots />
        <FeaturedActivities />
        <LatestNews />
      </main>
      <Footer />
    </div>
  )
}
