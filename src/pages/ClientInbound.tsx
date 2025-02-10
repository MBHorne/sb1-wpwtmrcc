import React from 'react';
import { useParams } from 'react-router-dom';
import Inbound from './Inbound';

const ClientInbound = () => {
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <Inbound clientFilter={clientId} />
  );
};

export default ClientInbound;