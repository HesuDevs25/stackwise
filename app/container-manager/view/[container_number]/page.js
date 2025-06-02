import ContainerDetailsClient from './ContainerDetailsClient';

export default function ContainerDetailsPage({ params }) {
    return <ContainerDetailsClient containerNumber={params.container_number} />;
} 