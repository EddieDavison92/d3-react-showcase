import { Story } from "@/components/story/Story"
import { getStoryData } from "@/lib/story/data"

export default async function HomePage() {
  const data = await getStoryData()
  return <Story data={data} />
}
